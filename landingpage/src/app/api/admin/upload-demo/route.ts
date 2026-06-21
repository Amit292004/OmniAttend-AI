import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('omniattend_session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_only_for_dev');
    
    let payload;
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { role: true }
    });

    // We check for 'ADMIN' role. 
    if (user?.role?.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const targetPath = formData.get('targetPath') as string;

    if (!file || !targetPath) {
      return NextResponse.json({ error: 'File and targetPath are required' }, { status: 400 });
    }

    // Validate targetPath to prevent path traversal
    if (!targetPath.startsWith('/img/demo/') || targetPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid target path' }, { status: 400 });
    }

    // Read file contents
    const buffer = Buffer.from(await file.arrayBuffer());

    // Construct physical file path
    const physicalPath = path.join(process.cwd(), 'public', targetPath);

    // Save file
    await fs.writeFile(physicalPath, buffer);

    return NextResponse.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
