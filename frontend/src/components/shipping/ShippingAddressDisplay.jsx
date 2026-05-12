import { MapPin, User, Phone } from 'lucide-react';

export default function ShippingAddressDisplay({ method, address, pickupLocation }) {
  if (method === 'pickup_point') {
    return (
      <div className="card p-5 bg-leaf-50/30">
        <div className="font-display font-semibold text-base text-ink-900 mb-2 flex items-center gap-2">
          <MapPin size={18} className="text-leaf-600" /> Ponto de retirada combinado
        </div>
        <p className="font-body text-sm text-ink-900 whitespace-pre-wrap">{pickupLocation}</p>
      </div>
    );
  }

  if (!address) return null;
  return (
    <div className="card p-5 bg-sky-50/30">
      <div className="font-display font-semibold text-base text-ink-900 mb-3 flex items-center gap-2">
        <MapPin size={18} className="text-sky-600" /> Endereço de envio
      </div>
      <div className="text-sm text-ink-900 space-y-1">
        <div><User size={14} className="inline mr-1 text-ink-500" /> {address.recipient_name}</div>
        <div><Phone size={14} className="inline mr-1 text-ink-500" /> {address.recipient_phone}</div>
        <div className="pt-2">
          {address.street}, {address.number}
          {address.complement && ` — ${address.complement}`}
        </div>
        <div>{address.neighborhood} — {address.city}/{address.state}</div>
        <div className="text-ink-700">CEP: {address.cep}</div>
      </div>
    </div>
  );
}
