// contact/contact.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ========== PUBLIC ROUTE ==========
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createContactDto: CreateContactDto,
    @Request() req: any,
  ) {
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];
    const userId = req?.user?.id;

    return this.contactService.createContact(
      createContactDto,
      ip,
      userAgent,
      userId,
    );
  }

  // ========== ADMIN ROUTES ==========
  @Get('statistics')
  @UseGuards(JwtGuard, AdminGuard)
  async getStatistics() {
    try {
      const stats = await this.contactService.getStatistics();
      return {
        success: true,
        data: stats,
        message: 'Contact statistics retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to get statistics');
    }
  }

  @Get()
  @UseGuards(JwtGuard, AdminGuard)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('subject') subject?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const filters = {
        ...(status && { status }),
        ...(subject && { subject }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      const skip = (page - 1) * limit;
      const contacts = await this.contactService.findAll(filters);
      
      // Manual pagination
      const paginatedContacts = contacts.slice(skip, skip + limit);
      
      return {
        success: true,
        data: paginatedContacts,
        meta: {
          total: contacts.length,
          page,
          limit,
          pages: Math.ceil(contacts.length / limit),
        },
        message: 'Contacts retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve contacts');
    }
  }

  @Get('admin/dashboard/stats')
  @UseGuards(JwtGuard, AdminGuard)
  async getDashboardStats(
    @Query('timeRange') timeRange: string = '7days',
  ) {
    try {
      const stats = await this.contactService.getStatistics();
      
      // Get recent contacts for the time range
      const days = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const recentContacts = await this.contactService.findAll({
        startDate: startDate.toISOString(),
      });

      return {
        success: true,
        data: {
          overview: {
            total: stats.total,
            new: stats.byStatus?.find((s: any) => s.status === 'NEW')?._count || 0,
            responded: stats.byStatus?.find((s: any) => s.status === 'RESPONDED')?._count || 0,
            today: stats.todayCount,
          },
          byStatus: stats.byStatus,
          bySubject: stats.bySubject,
          recent: recentContacts.slice(0, 5),
          timeRange,
        },
        message: 'Dashboard stats retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to get dashboard stats');
    }
  }

  @Get('admin/contacts/recent')
  @UseGuards(JwtGuard, AdminGuard)
  async getRecentContacts() {
    try {
      const contacts = await this.contactService.findAll({});
      const recent = contacts
        .sort((a:any, b:any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10);
      
      return {
        success: true,
        data: recent,
        message: 'Recent contacts retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException('Failed to get recent contacts');
    }
  }

  @Get(':identifier')
  @UseGuards(JwtGuard, AdminGuard)
  async findOne(@Param('identifier') identifier: string) {
    try {
      const contact = await this.contactService.findOne(identifier);
      
      return {
        success: true,
        data: contact,
        message: 'Contact retrieved successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Contact not found');
      }
      throw new BadRequestException('Failed to retrieve contact');
    }
  }

 @Put(':identifier/status')
@UseGuards(JwtGuard, AdminGuard)
async updateStatus(
  @Param('identifier') identifier: string,
  @Body() updateContactDto: UpdateContactDto,
) {
  try {
    // Make sure status is not undefined
    if (!updateContactDto.status) {
      throw new BadRequestException('Status is required');
    }

    const contact = await this.contactService.updateStatus(
      identifier,
      updateContactDto.status,
      updateContactDto.notes,
    );

    return {
      success: true,
      data: contact,
      message: 'Contact status updated successfully',
    };
  } catch (error) {
    if (error instanceof NotFoundException) {
      throw new NotFoundException('Contact not found');
    }
    throw new BadRequestException('Failed to update contact status');
  }
}

  @Delete(':identifier')
  @UseGuards(JwtGuard, AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('identifier') identifier: string) {
    try {
      await this.contactService.delete(identifier);
      return {
        success: true,
        message: 'Contact deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Contact not found');
      }
      throw new BadRequestException('Failed to delete contact');
    }
  }

  // ========== HELPER ENDPOINTS ==========
  @Get('health')
  async healthCheck() {
    return { 
      status: 'OK', 
      service: 'contact-service',
      timestamp: new Date().toISOString()
    };
  }
}