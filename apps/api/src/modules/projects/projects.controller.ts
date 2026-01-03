import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';
import { Project } from '../../database/entities/project.entity';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(@Query('companyId') companyId?: string, @Request() req?: any): Promise<Project[]> {
    const effectiveCompanyId = companyId || req?.user?.companyId;
    return this.projectsService.findAll(effectiveCompanyId);
  }

  // IMPORTANTE: Rotas literais devem vir ANTES de rotas com parâmetros dinâmicos
  @Get('time-entries')
  async findAllTimeEntries(
    @Query('projectId') projectId?: string, 
    @Query('proposalId') proposalId?: string, 
    @Query('clientId') clientId?: string,
    @Query('ids') ids?: string
  ): Promise<any[]> {
    console.log('\n========== Controller findAllTimeEntries CHAMADO ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Query params recebidos:', { projectId, proposalId, clientId, ids });
    console.log('Tipo de ids:', typeof ids);
    console.log('Valor de ids:', ids);
    
    // Se ids for fornecido, buscar apenas essas entries
    if (ids) {
      try {
        console.log('IDs recebidos (raw):', ids);
        const idArray = JSON.parse(ids);
        console.log('Controller recebeu IDs (parseados):', idArray);
        if (Array.isArray(idArray) && idArray.length > 0) {
          console.log('Buscando entries com', idArray.length, 'IDs');
          const result = await this.projectsService.findTimeEntriesByIds(idArray);
          console.log('Controller retornando entries:', result.length);
          return result;
        } else {
          console.warn('IDs parseados não são um array válido ou está vazio');
        }
      } catch (e) {
        console.error('Erro ao parsear IDs no controller:', e);
        console.error('Stack:', e.stack);
        // Se não for JSON válido, continuar com busca normal
      }
    }
    console.log('Buscando todas as entries (sem filtro de IDs)');
    const result = await this.projectsService.findTimeEntries(projectId, proposalId, clientId);
    console.log('Controller retornando', result.length, 'entries (busca geral)');
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  async create(@Body() projectData: Partial<Project>, @Request() req?: any): Promise<Project> {
    const companyId = req?.user?.companyId || projectData.companyId;
    if (!companyId) {
      throw new Error('companyId é obrigatório');
    }
    projectData.companyId = companyId;
    return this.projectsService.create(projectData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() projectData: Partial<Project>): Promise<Project> {
    return this.projectsService.update(id, projectData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.projectsService.delete(id);
  }

  @Get('tasks/all')
  async findAllTasks(@Query('projectId') projectId?: string): Promise<any[]> {
    return this.projectsService.findAllTasks(projectId);
  }

  @Get(':id/tasks')
  async findProjectTasks(@Param('id') projectId: string): Promise<any[]> {
    return this.projectsService.findAllTasks(projectId);
  }

  @Post('tasks')
  async createTaskStandalone(@Body() taskData: any): Promise<any> {
    // Validar que pelo menos um vínculo existe
    if (!taskData.projectId && !taskData.proposalId && !taskData.clientId) {
      throw new Error('É necessário vincular a um Projeto, Negociação ou Cliente');
    }
    return this.projectsService.createTaskStandalone(taskData);
  }

  @Post(':id/tasks')
  async createTask(@Param('id') projectId: string, @Body() taskData: any): Promise<any> {
    return this.projectsService.createTask(projectId, taskData);
  }

  @Put(':id/tasks/:taskId')
  async updateTask(@Param('id') projectId: string, @Param('taskId') taskId: string, @Body() taskData: any): Promise<any> {
    return this.projectsService.updateTask(projectId, taskId, taskData);
  }

  @Get(':id/time-entries')
  async findTimeEntries(@Param('id') projectId: string): Promise<any[]> {
    return this.projectsService.findTimeEntries(projectId);
  }

  @Post('time-entries')
  async createTimeEntry(@Body() timeEntryData: any): Promise<any> {
    return this.projectsService.createTimeEntry(timeEntryData);
  }

  @Post(':id/time-entries')
  async createTimeEntryForProject(@Param('id') projectId: string, @Body() timeEntryData: any): Promise<any> {
    return this.projectsService.createTimeEntry({ ...timeEntryData, projectId });
  }

  @Patch('time-entries/:entryId')
  async updateTimeEntry(@Param('entryId') entryId: string, @Body() timeEntryData: any, @Request() req?: any): Promise<any> {
    const userId = req?.user?.id; // ID do usuário que está fazendo a atualização
    return this.projectsService.updateTimeEntry(entryId, timeEntryData, userId);
  }

  @Patch(':id/time-entries/:entryId')
  async updateTimeEntryForProject(@Param('id') projectId: string, @Param('entryId') entryId: string, @Body() timeEntryData: any): Promise<any> {
    return this.projectsService.updateTimeEntry(entryId, { ...timeEntryData, projectId });
  }

  @Post('time-entries/:id/approve')
  async approveTimeEntry(@Param('id') entryId: string, @Body() body?: any, @Request() req?: any): Promise<any> {
    const companyId = req?.user?.companyId;
    const userId = req?.user?.id; // ID do usuário que está aprovando
    const motivoAprovacao = body?.motivoAprovacao;
    const valorPorHora = body?.valorPorHora;
    const criarInvoice = body?.criarInvoice !== false; // Por padrão, criar invoice (true)
    // O service agora busca o companyId automaticamente se não for fornecido
    return this.projectsService.approveTimeEntry(entryId, companyId, motivoAprovacao, valorPorHora, criarInvoice, userId);
  }

  @Patch('tasks/:taskId')
  async patchTask(@Param('taskId') taskId: string, @Body() taskData: any): Promise<any> {
    // Buscar o projeto da tarefa
    const task = await this.projectsService.findTaskById(taskId);
    if (!task) {
      throw new Error('Tarefa não encontrada');
    }
    // Passar projectId mesmo se for null/undefined
    return this.projectsService.updateTask(task.projectId || null, taskId, taskData);
  }

  @Get('tasks/:taskId/comments')
  async getTaskComments(@Param('taskId') taskId: string): Promise<any[]> {
    return this.projectsService.findTaskComments(taskId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('tasks/:taskId/comments')
  async createTaskComment(
    @Param('taskId') taskId: string,
    @Body() commentData: { texto: string },
    @Request() req: any,
  ): Promise<any> {
    try {
      console.log('createTaskComment - req.user:', req?.user);
      console.log('createTaskComment - req.headers:', req?.headers?.authorization ? 'Token presente' : 'Token ausente');
      const userId = req.user.id;
      console.log('createTaskComment - userId:', userId);
      if (!commentData?.texto || !commentData.texto.trim()) {
        throw new Error('Texto do comentário é obrigatório');
      }
      return await this.projectsService.createTaskComment(taskId, userId, commentData.texto);
    } catch (error: any) {
      console.error('Erro ao criar comentário:', error);
      throw error;
    }
  }

  @Delete('tasks/comments/:commentId')
  async deleteTaskComment(@Param('commentId') commentId: string): Promise<void> {
    return this.projectsService.deleteTaskComment(commentId);
  }
}

