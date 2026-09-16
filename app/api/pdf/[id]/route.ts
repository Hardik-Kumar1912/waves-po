import { dbConnect } from '@/lib/db';
import { PurchaseOrder } from '@/lib/models/PurchaseOrder';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import type { DocumentProps } from '@react-pdf/renderer';
import { PODocument, type POData } from '@/components/PODocument';
import fs from 'fs';
import path from 'path';

// Must run in Node.js runtime (uses fs, renderToBuffer)
export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();
  const { id } = await params;

  const po = await PurchaseOrder.findById(id).populate('supplierId').lean();
  if (!po) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Load logo — prefer the renamed file, fall back to original
  const logoCandidates = ['waves-international-logo.png', 'logo.png'];
  let logoSrc = '';
  for (const name of logoCandidates) {
    const p = path.join(process.cwd(), 'public', name);
    if (fs.existsSync(p)) {
      logoSrc = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
      break;
    }
  }

  // Load signature image
  const sigCandidates = ['waves-international-signature.png', 'sign.png'];
  let signatureSrc = '';
  for (const name of sigCandidates) {
    const p = path.join(process.cwd(), 'public', name);
    if (fs.existsSync(p)) {
      signatureSrc = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
      break;
    }
  }

  // Cast through unknown: mongoose lean populates supplierId but TS still sees ObjectId
  const poData = po as unknown as POData;

  // Cast through unknown: renderToBuffer expects ReactElement<DocumentProps>,
  // but createElement returns FunctionComponentElement<PODocumentProps>
  const element = React.createElement(
    PODocument,
    { po: poData, logoSrc, signatureSrc }
  ) as unknown as React.ReactElement<DocumentProps>;

  const buffer = await renderToBuffer(element);

  // Wrap Buffer in Uint8Array so it's assignable to BodyInit
  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="PO-${po.orderNumber}.pdf"`,
    },
  });
}
