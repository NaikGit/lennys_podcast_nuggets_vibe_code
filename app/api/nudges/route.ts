import { NextResponse } from 'next/server';
import { nudges } from '../../../data/nudges';

export function GET() {
  return NextResponse.json({ nudges });
}
