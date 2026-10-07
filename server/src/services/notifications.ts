export interface NotificationPayload {
  pedidoId: number;
  clienteNombre: string;
  clienteTelefono?: string | null;
  direccionEntrega: string;
  horaEntregaExacta: string; // Formatted exact delivery time
  fechaPedido: string;
  items: {
    calidadNombre: string;
    unidadMedida: string;
    cantidadUnidades: number;
    subtotal: number;
  }[];
  totalCantidadJabas: number;
  totalPrecio: number;
  notas?: string | null;
}

export function formatAdminOrderMessage(data: NotificationPayload): string {
  const itemsText = data.items
    .map(
      (item) =>
        `• ${item.cantidadUnidades} ${item.unidadMedida} de ${item.calidadNombre} (S/. ${item.subtotal.toFixed(2)})`
    )
    .join('\n');

  return `🐔 *NUEVO PEDIDO DE HUEVOS DON LUCHO #PED-${data.pedidoId}*

👤 *Cliente:* ${data.clienteNombre}
📞 *Teléfono:* ${data.clienteTelefono || 'No especificado'}
📍 *Dirección de Entrega:* ${data.direccionEntrega}

📦 *CANTIDAD TOTAL SOLICITADA:*
${itemsText}
*Equivalente Total:* ${data.totalCantidadJabas.toFixed(2)} Jabas

⏰ *HORA EXACTA DE ENTREGA PROGRAMADA:*
👉 *${data.horaEntregaExacta}*

💰 *Total a Cobrar:* S/. ${data.totalPrecio.toFixed(2)}
${data.notas ? `📝 *Notas:* ${data.notas}\n` : ''}
_Por favor preparar el despacho para cumplir con la ventana de entrega de 30 a 90 minutos._`;
}

export function generateWhatsAppLink(
  adminPhone: string = '51916607918',
  data: NotificationPayload
): string {
  const message = formatAdminOrderMessage(data);
  let cleanPhone = adminPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length === 9) {
    cleanPhone = `51${cleanPhone}`;
  }
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

export async function notifyAdminNewOrder(data: NotificationPayload): Promise<{
  whatsappUrl: string;
  message: string;
}> {
  const rawPhone = process.env.ADMIN_WHATSAPP_PHONE || '51916607918';
  const adminEmail = process.env.ADMIN_EMAIL || 'fvasquezperez998@gmail.com';
  const message = formatAdminOrderMessage(data);
  const whatsappUrl = generateWhatsAppLink(rawPhone, data);

  // Registro del despacho de notificación en consola / logs del servidor
  console.log('====================================================');
  console.log(`[NOTIFICACIÓN ADMIN] Pedido #PED-${data.pedidoId}`);
  console.log(`- Administrador: ${adminEmail}`);
  console.log(`- WhatsApp Admin: +${rawPhone.startsWith('51') ? rawPhone : '51' + rawPhone}`);
  console.log(`- Hora Exacta de Entrega: ${data.horaEntregaExacta}`);
  console.log(`- Total Cantidad Solicitada: ${data.totalCantidadJabas.toFixed(2)} Jabas`);
  console.log(`- Total Soles: S/. ${data.totalPrecio.toFixed(2)}`);
  console.log(`- Enlace WhatsApp Generado: ${whatsappUrl}`);
  console.log('====================================================');

  return { whatsappUrl, message };
}

