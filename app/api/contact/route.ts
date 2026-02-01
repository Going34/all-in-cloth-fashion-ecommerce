import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/response';
import { getDbClient } from '@/lib/db';

export interface ContactInquiryInput {
  full_name: string;
  business_name: string;
  email: string;
  inquiry_type: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const inquiryData: ContactInquiryInput = {
      full_name: body.full_name?.trim() || '',
      business_name: body.business_name?.trim() || '',
      email: body.email?.trim() || '',
      inquiry_type: body.inquiry_type?.trim() || '',
      message: body.message?.trim() || '',
    };

    if (!inquiryData.full_name || !inquiryData.email || !inquiryData.message) {
      return errorResponse(new Error('Full name, email, and message are required'), 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inquiryData.email)) {
      return errorResponse(new Error('Invalid email address'), 400);
    }

    const supabase = await getDbClient();

    const { data, error } = await supabase
      .from('contact_inquiries')
      .insert({
        full_name: inquiryData.full_name,
        business_name: inquiryData.business_name || null,
        email: inquiryData.email,
        inquiry_type: inquiryData.inquiry_type || null,
        message: inquiryData.message,
        status: 'new',
      } as any)
      .select()
      .single();

    if (error) {
      console.error('Error creating contact inquiry:', error);
      
      if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
        console.warn('contact_inquiries table does not exist. Creating inquiry without database storage.');
        return successResponse({
          id: `temp_${Date.now()}`,
          ...inquiryData,
          status: 'new',
          created_at: new Date().toISOString(),
          message: 'Inquiry received. Note: Database table not yet created.',
        }, 201);
      }
      
      throw error;
    }

    return successResponse(data, 201);
  } catch (error) {
    console.error('Contact API error:', error);
    return errorResponse(error);
  }
}








