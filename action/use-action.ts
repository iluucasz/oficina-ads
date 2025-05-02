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
    console.log(`[removeUserAvatar] Iniciando remoção de avatar para usuário: ${userId}`);
    
    if (!userId) {
      return { success: false, message: 'ID de usuário inválido' };
    }
    
    // Buscar o usuário para obter a URL atual do avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });
    
    console.log(`[removeUserAvatar] Avatar encontrado: ${user?.avatarUrl}`);
    
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
      console.log(`[removeUserAvatar] Tentando remover imagem do Cloudinary: ${user.avatarUrl}`);
      
      // Obter o public_id a partir da URL
      const publicId = extractPublicIdFromUrl(user.avatarUrl);
      console.log(`[removeUserAvatar] Public ID extraído: ${publicId}`);
      
      if (publicId) {
        // Remover do Cloudinary
        console.log(`[removeUserAvatar] Removendo imagem com public_id: ${publicId}`);
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`[removeUserAvatar] Resposta do Cloudinary:`, result);
        cloudinarySuccess = result.result === 'ok';
      } 
      
      // Mesmo se obter public_id da URL falhar, tentar com o formato padrão
      if (!publicId || !cloudinarySuccess) {
        // Tentar com o formato padrão
        const defaultPublicId = `avatars/user-${userId}`;
        console.log(`[removeUserAvatar] Tentando remover com ID padrão: ${defaultPublicId}`);
        const result = await cloudinary.uploader.destroy(defaultPublicId);
        console.log(`[removeUserAvatar] Resposta do Cloudinary (formato padrão):`, result);
        cloudinarySuccess = result.result === 'ok';
      }
    } catch (cloudinaryError) {
      // Mesmo com erro no Cloudinary, continuaremos para atualizar o banco
      console.error(`[removeUserAvatar] Erro ao remover do Cloudinary:`, cloudinaryError);
      cloudinarySuccess = false;
    }
    
    // Atualizar o banco de dados para remover a referência ao avatar
    try {
      console.log(`[removeUserAvatar] Atualizando banco de dados para remover referência ao avatar`);
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null }
      });
      
      console.log(`[removeUserAvatar] Banco de dados atualizado com sucesso`);
      
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
    console.log(`[extractPublicIdFromUrl] Extraindo public_id de: ${url}`);

    // Verificar se a string está vazia ou é null/undefined
    if (!url) {
      console.log('[extractPublicIdFromUrl] URL está vazia ou null');
      return null;
    }

    // Primeiro tenta com o padrão v1/upload/public_id
    const uploadRegex = /\/(?:v\d+\/)?upload\/([^/]+\/[^/.]+)(?:\.[^/.]+)?$/;
    const match1 = url.match(uploadRegex);
    
    if (match1 && match1[1]) {
      console.log(`[extractPublicIdFromUrl] Match 1: ${match1[1]}`);
      return match1[1];
    }
    
    // Tenta extrair o formato avatars/user-ID
    const userAvatarRegex = /(avatars\/user-[^/.]+)(?:\.[^/.]+)?$/;
    const match2 = url.match(userAvatarRegex);
    
    if (match2 && match2[1]) {
      console.log(`[extractPublicIdFromUrl] Match 2: ${match2[1]}`);
      return match2[1];
    }
    
    // Tenta o formato mais simples para extrair apenas o caminho
    const simpleRegex = /\/([^/]+\/[^/.]+)(?:\.[^/.]+)?$/;
    const match3 = url.match(simpleRegex);
    
    if (match3 && match3[1]) {
      console.log(`[extractPublicIdFromUrl] Match 3: ${match3[1]}`);
      return match3[1];
    }
    
    // Ultimo recurso: extrair o nome do arquivo sem extensão
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    const fileNameWithoutExt = lastPart.split('.')[0];
    
    if (fileNameWithoutExt) {
      console.log(`[extractPublicIdFromUrl] Último recurso: ${fileNameWithoutExt}`);
      return fileNameWithoutExt;
    }
    
    console.log('[extractPublicIdFromUrl] Não foi possível extrair o public_id');
    return null;
  } catch (error) {
    console.error('[extractPublicIdFromUrl] Erro ao extrair public_id:', error);
    return null;
  }
} 