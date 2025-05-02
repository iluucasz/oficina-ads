"use server";

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Aqui você implementaria a lógica real para:
    // 1. Fazer upload da imagem para um serviço de armazenamento (como AWS S3, Cloudinary, etc)
    // 2. Obter a URL da imagem após o upload
    // 3. Atualizar o campo avatarUrl do usuário no banco de dados
    
    console.log('Upload solicitado para o usuário:', userId, 'nome do arquivo:', file.name);
    
    // Para fins de simulação, vamos apenas retornar sucesso após um delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Aqui teríamos uma URL real retornada pelo serviço de storage
    const mockImageUrl = `/avatars/${userId}-${Date.now()}.jpg`;
    
    // Atualizar o perfil do usuário com a nova URL de avatar
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: mockImageUrl }
      });
    } catch (dbError) {
      console.error('Erro ao atualizar URL do avatar no banco:', dbError);
      // Continua mesmo com erro de BD para fins de teste
    }
    
    return { 
      success: true, 
      message: 'Avatar atualizado com sucesso',
      avatarUrl: mockImageUrl // Em produção, seria a URL real da imagem armazenada
    };
  } catch (error) {
    console.error('Erro ao atualizar avatar:', error);
    return { success: false, message: 'Erro ao atualizar avatar' };
  }
} 