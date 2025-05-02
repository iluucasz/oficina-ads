"use server";

import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

const prisma = new PrismaClient();

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Action para atualizar o avatar do usuário
 */
export async function updateUserAvatar(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const file = formData.get('avatar') as File;
    
    if (!userId || !file) {
      return { success: false, message: 'Dados inválidos' };
    }
    
    // Buscar o usuário para verificar se já existe um avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });
    
    // Se já existir um avatar, extrair o public_id e deletar
    if (user?.avatarUrl) {
      try {
        const publicId = extractPublicIdFromUrl(user.avatarUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (deleteError) {
        console.error('Erro ao deletar imagem anterior:', deleteError);
        // Continuar mesmo se houver erro na deleção
      }
    }
    
    // Convertendo o arquivo para um formato que o Cloudinary possa processar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Upload para o Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          public_id: `user-${userId}`,
          overwrite: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      
      // Envia o buffer para o stream de upload
      uploadStream.write(buffer);
      uploadStream.end();
    });
    
    // Extrair a URL da resposta do Cloudinary
    const imageUrl = (uploadResult as any).secure_url;
    
    // Atualizar o perfil do usuário com a nova URL de avatar
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: imageUrl }
      });
    } catch (dbError) {
      return { success: false, message: 'Erro ao salvar avatar no banco de dados' };
    }
    
    return { 
      success: true, 
      message: 'Avatar atualizado com sucesso',
      avatarUrl: imageUrl
    };
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    return { success: false, message: 'Erro ao atualizar avatar' };
  }
}

/**
 * Action para remover o avatar do usuário
 */
export async function removeUserAvatar(userId: string) {
  try {
    
    if (!userId) {
      return { success: false, message: 'ID de usuário inválido' };
    }
    
    // Buscar o usuário para obter a URL atual do avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });
    
    
    // Se não encontrou o usuário ou não tem avatarUrl, retornar erro amigável
    if (!user || !user.avatarUrl) {
      
      // Mesmo assim, tente atualizar o banco para garantir que o campo seja null
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { avatarUrl: null }
        });
      } catch (err) {
        console.error(`[removeUserAvatar] Erro ao garantir que avatarUrl é null:`, err);
      }
      
      // Retorna sucesso mesmo não tendo avatar para remover,
      // pois o estado final no banco de dados é o desejado (avatarUrl = null)
      return { success: true, message: 'Nenhum avatar para remover, campo limpo com sucesso' };
    }
    
    // Independentemente de conseguir remover do Cloudinary, vamos atualizar o banco
    let cloudinarySuccess = false;
    
    // Tentar remover do Cloudinary
    try {
      // Obter o public_id a partir da URL
      const publicId = extractPublicIdFromUrl(user.avatarUrl);
      
      if (publicId) {
        // Remover do Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        cloudinarySuccess = true;
      } else {
        
        // Tentar com o formato padrão
        const defaultPublicId = `avatars/user-${userId}`;
        const result = await cloudinary.uploader.destroy(defaultPublicId);
        console.log(`[removeUserAvatar] Resposta do Cloudinary (formato padrão):`, result);
        cloudinarySuccess = true;
      }
    } catch (cloudinaryError) {
      // Mesmo com erro no Cloudinary, continuaremos para atualizar o banco
      console.error(`[removeUserAvatar] Erro ao remover do Cloudinary:`, cloudinaryError);
      cloudinarySuccess = false;
    }
    
    // Atualizar o banco de dados para remover a referência ao avatar
    try {
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null }
      });
      
      
      return { 
        success: true, 
        message: cloudinarySuccess 
          ? 'Avatar removido completamente com sucesso'
          : 'Avatar removido do banco de dados, mas houve um problema com o Cloudinary'
      };
    } catch (dbError) {
      console.error(`[removeUserAvatar] Erro ao atualizar banco de dados:`, dbError);
      return { success: false, message: 'Erro ao remover avatar do banco de dados' };
    }
  } catch (error) {
    console.error(`[removeUserAvatar] Erro geral:`, error);
    return { success: false, message: 'Erro ao remover avatar' };
  }
}

/**
 * Função auxiliar para extrair o public_id de uma URL do Cloudinary
 */
function extractPublicIdFromUrl(url: string): string | null {
  try {

    // Regex melhorada para suportar diferentes formatos de URL do Cloudinary
    // Pode capturar URLs com ou sem número de versão (v1, v1746192193, etc)
    // E também com diferentes extensões de arquivo (.jpg, .png, .webp, etc)
    const regex = /\/(?:v\d+\/|upload\/)((?:[\w-]+\/)*[\w-]+)(?:\.\w+)?$/;
    const match = url.match(regex);
    
    
    if (match && match[1]) {
      return match[1]; // Retorna o public_id, por exemplo "avatars/user-123456"
    }
    
    // Fallback alternativo: extrair o caminho após a última barra
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const fileNameWithoutExt = lastPart.split('.')[0];
    
    if (fileNameWithoutExt) {
      return fileNameWithoutExt;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao extrair public_id:', error);
    return null;
  }
} 