import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Send, AlertTriangle, CheckCircle2, X, Flag, Star, Sparkles} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORY_LABEL, STATUS_COLOR, STATUS_LABEL, TRUST_BADGE, TRUST_LABEL, memberSince } from '../constants.js';
import ShippingMethodPicker from '../components/shipping/ShippingMethodPicker.jsx';
import ShippingAddressForm from '../components/shipping/ShippingAddressForm.jsx';
import PickupLocationForm from '../components/shipping/PickupLocationForm.jsx';
import ShippingAddressDisplay from '../components/shipping/ShippingAddressDisplay.jsx';
import TrackingForm from '../components/shipping/TrackingForm.jsx';
import TrackingDisplay from '../components/shipping/TrackingDisplay.jsx';


import { useNoIndex } from '../components/NoIndex.jsx';
export default function HelpRequestDetail() {
  useNoIndex();
  const { id } = useParams();
  const { user } = useAuth();
  const [req, setReq] = useState(null);
  const [offers, setOffers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [ratings, setRatings] = useState([]);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const chatBottomRef = useRef(null);

  const isOwner = req && req.requester?.id === user.id;
  const isRequester = isOwner;
  const isAcceptedHelper = !!req?.is_accepted_helper;
  const canChat = req && req.status === 'matched';

  const showToast = (msg, kind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 3500);
  };

  const loadAll = async () => {
    try {
      const r = await api.get(`/help-requests/${id}`);
      setReq(r.data);

      if (r.data.requester?.id === user.id) {
        const o = await api.get(`/help-requests/${id}/offers`);
        setOffers(o.data);
      }

      if (r.data.status === 'matched' || r.data.status === 'closed') {
        const m = await api.get(`/help-requests/${id}/messages`);
        setMessages(m.data);
      }
      if (r.data.status === 'closed') {
        try {
          const rv = await api.get(`/help-requests/${id}/ratings`);
          setRatings(rv.data);
          setRatingSubmitted(rv.data.some(r => r.rater_id === user.id));
        } catch {}
      }
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao carregar pedido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, [id]);

  // Polling simples do chat a cada 5s quando matched
  useEffect(() => {
    if (!canChat) return;
    const interval = setInterval(async () => {
      try {
        const last = messages[messages.length - 1]?.id || 0;
        const { data } = await api.get(`/help-requests/${id}/messages`, {
          params: last ? { after_id: last } : {},
        });
        if (data.length > 0) {
          setMessages(prev => last ? [...prev, ...data] : data);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [canChat, messages, id]);

  // Auto-scroll do chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const submitOffer = async () => {
    try {
      await api.post(`/help-requests/${id}/offers`, { message: offerMessage || null });
      showToast('Oferta enviada! O solicitante foi avisado.');
      setOfferMessage('');
      loadAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao enviar oferta', 'error');
    }
  };

  const acceptOffer = async (offerId) => {
    try {
      await api.post(`/offers/${offerId}/accept`);
      showToast('Oferta aceita! Chat liberado.');
      loadAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao aceitar', 'error');
    }
  };

  const declineOffer = async (offerId) => {
    try {
      await api.post(`/offers/${offerId}/decline`);
      showToast('Oferta recusada');
      loadAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao recusar', 'error');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    try {
      const { data } = await api.post(`/help-requests/${id}/messages`, { content: chatInput });
      setMessages(prev => [...prev, data]);
      setChatInput('');
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao enviar', 'error');
    }
  };

  const closeRequest = async () => {
    if (!confirm('Marcar este pedido como concluído?')) return;
    try {
      await api.post(`/help-requests/${id}/close`);
      showToast('Pedido concluído. Obrigado!');
      loadAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao fechar', 'error');
    }
  };

  const submitRating = async () => {
    if (!ratingScore) return;
    try {
      await api.post(`/help-requests/${id}/rate`, {
        score: ratingScore,
        comment: ratingComment || null,
      });
      showToast('Avaliação enviada! Obrigado pelo feedback.');
      setRatingSubmitted(true);
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao enviar avaliação', 'error');
    }
  };

  const submitReport = async () => {
    try {
      await api.post(`/help-requests/${id}/report`, { reason: reportReason || null });
      showToast('Denúncia enviada à moderação. Obrigado.');
      setShowReport(false);
      setReportReason('');
      loadAll();
    } catch (e) {
      showToast(e.response?.data?.detail || 'Erro ao denunciar', 'error');
    }
  };

  if (loading) {
    return <section className="max-w-4xl mx-auto px-6 py-12"><div className="card h-64 bg-ink-100 animate-pulse" /></section>;
  }
  if (error) {
    return (
      <section className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">Não foi possível abrir</h1>
        <p className="font-body text-ink-700">{error}</p>
        <Link to="/dashboard" className="btn-primary mt-6">Voltar</Link>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-6 lg:px-10 py-12">
      <Link to={isOwner ? '/my-requests' : '/help-requests'} className="inline-flex items-center gap-2 text-sky-900 hover:text-sky-600 mb-6 text-sm">
        <ArrowLeft size={16} /> Voltar
      </Link>

      {/* Cabeçalho do pedido */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 font-display font-semibold">
            {CATEGORY_LABEL[req.category] || req.category}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[req.status] || ''}`}>
            {STATUS_LABEL[req.status] || req.status}
          </span>
        </div>
        <h1 className="font-display font-bold text-3xl text-ink-900 mb-3">{req.title}</h1>
        <div className="flex items-center gap-3 text-sm text-ink-700 mb-4 flex-wrap">
          <span className="flex items-center gap-1"><MapPin size={14} />{req.city}/{req.state}</span>
          <span>·</span>
          <span>{isOwner ? 'Você' : req.requester?.name}</span>
          {!isOwner && req.requester?.created_at && (
            <>
              <span>·</span>
              <span className="text-ink-400">membro há {memberSince(req.requester.created_at)}</span>
            </>
          )}
          {!isOwner && req.requester?.rating_count > 0 && (
            <>
              <span>·</span>
              <span className="flex items-center gap-1 text-sun-600 font-medium">
                <Star size={13} className="fill-sun-400 text-sun-400" />
                {req.requester.avg_rating?.toFixed(1)}
                <span className="text-ink-400 font-normal">({req.requester.rating_count})</span>
              </span>
            </>
          )}
        </div>
        {req.is_institutional && (
          <div className="card p-4 mb-4 bg-sun-50 border-sun-300 border-2">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-sun-700" />
              <span className="font-display font-bold text-sun-800">Verificado pela Luz Coletiva</span>
            </div>
            <p className="text-sm text-ink-700 leading-relaxed">
              Este pedido foi cadastrado pela equipe Luz Coletiva em nome de <strong>{req.assisted_profile_name || 'uma pessoa assistida'}</strong>, 
              que não tem acesso digital direto. Verificamos a história presencialmente. 
              A coordenação da entrega será feita pela equipe da plataforma.
            </p>
          </div>
        )}
        <p className="font-body text-ink-900 leading-relaxed whitespace-pre-wrap">{req.description}</p>

        {(req.status === 'matched' || req.status === 'in_transit' || req.status === 'delivered' || req.status === 'closed') && (
          <div className="mt-5 pt-5 border-t border-ink-100 flex flex-wrap gap-2">
            {(req.status === 'matched' || req.status === 'delivered') && isOwner && (
              <button onClick={closeRequest} className="btn-secondary text-sm py-2">
                <CheckCircle2 size={16} /> {req.status === 'delivered' ? 'Fechar pedido' : 'Cancelar pedido'}
              </button>
            )}
            {req.has_open_report ? (
              <span className="inline-flex items-center gap-2 text-sm text-red-600 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                <Flag size={16} /> Conversa denunciada — em análise pela moderação
              </span>
            ) : (
              <button onClick={() => setShowReport(true)} className="btn-ghost text-sm py-2 text-red-600">
                <Flag size={16} /> Denunciar conversa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Helper: pode oferecer ajuda */}
      {!isOwner && (req.status === 'open' || req.status === 'proposed') && user.profile_type === 'helper' && (
        <div className="card p-6 mb-6 bg-sun-50/50">
          <h2 className="font-display font-semibold text-xl text-ink-900 mb-3">Oferecer ajuda</h2>
          <textarea rows={3} maxLength={500}
            className="input-field resize-none mb-3"
            placeholder="Mensagem opcional para o solicitante (sem telefones, e-mails ou links)"
            value={offerMessage}
            onChange={(e) => setOfferMessage(e.target.value)} />
          <div className="text-xs text-ink-700 mb-3">{offerMessage.length}/500</div>
          <button onClick={submitOffer} className="btn-primary">
            <Send size={16} /> Enviar oferta
          </button>
        </div>
      )}

      {/* Owner: lista de ofertas */}
      {isOwner && offers.length > 0 && req.status !== 'closed' && (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-semibold text-xl text-ink-900 mb-4">
            Pessoas que se ofereceram ({offers.length})
          </h2>
          <div className="space-y-3">
            {offers.map(o => (
              <div
                key={o.id}
                className={`flex items-start gap-4 p-4 rounded-xl border ${
                  o.helper.trust_level === 'parceiro_validado'
                    ? 'bg-sun-50/60 border-sun-300'
                    : 'bg-ink-50 border-ink-100'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sunrise flex items-center justify-center font-display font-bold text-ink-900 shrink-0">
                  {o.helper.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-semibold text-ink-900">{o.helper.name}</span>
                    {TRUST_BADGE[o.helper.trust_level] && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TRUST_BADGE[o.helper.trust_level]}`}>
                        {TRUST_LABEL[o.helper.trust_level]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-ink-400 mt-0.5">
                    {o.helper.rating_count > 0 && (
                      <span className="flex items-center gap-1 text-sun-600">
                        <Star size={11} className="fill-sun-400 text-sun-400" />
                        {o.helper.avg_rating?.toFixed(1)}
                        <span className="text-ink-400">({o.helper.rating_count})</span>
                      </span>
                    )}
                    <span>membro há {memberSince(o.helper.created_at)}</span>
                  </div>
                  {o.message && <p className="font-body text-sm text-ink-700 mt-1">{o.message}</p>}
                  <div className="text-xs text-ink-700 mt-2">
                    Status: <span className="font-medium">{o.status}</span>
                  </div>
                </div>
                {o.status === 'pending' && req.status !== 'matched' && (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => acceptOffer(o.id)} className="btn-primary text-xs py-1.5 px-3">Aceitar</button>
                    <button onClick={() => declineOffer(o.id)} className="btn-ghost text-xs py-1.5 px-3 text-red-600">Recusar</button>
                  </div>
                )}
                {o.status === 'accepted' && (
                  <span className="text-xs text-leaf-500 flex items-center gap-1 shrink-0">
                    <CheckCircle2 size={14} /> Aceito
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
        {/* === Wizard de logística pós-aceite === */}
        {(req.status === 'matched' || req.status === 'in_transit' || req.status === 'delivered') && req.accepted_offer_id && (
          <div className="space-y-4 mb-6">
            {/* Helper escolhe método */}
            {req.status === 'matched' && !req.shipping_method && !isRequester && isAcceptedHelper && (
              <ShippingMethodPicker requestId={req.id} onUpdated={(d) => setReq(d)} />
            )}
            {req.status === 'matched' && !req.shipping_method && isRequester && (
              <div className="card p-4 bg-ink-50">
                <p className="text-sm text-ink-700">
                  Aguardando o helper escolher o modo de entrega…
                </p>
              </div>
            )}

            {/* Ajudado preenche endereço (modo correios) */}
            {req.status === 'matched' && req.shipping_method === 'correios' && !req.shipping_address_json && isRequester && (
              <ShippingAddressForm
                requestId={req.id}
                defaultName={user?.name}
                onUpdated={(d) => setReq(d)}
              />
            )}
            {req.status === 'matched' && req.shipping_method === 'correios' && !req.shipping_address_json && !isRequester && (
              <div className="card p-4 bg-ink-50">
                <p className="text-sm text-ink-700">
                  Aguardando o solicitante preencher o endereço…
                </p>
              </div>
            )}

            {/* Ajudado preenche ponto de retirada */}
            {req.status === 'matched' && req.shipping_method === 'pickup_point' && !req.pickup_location && isRequester && (
              <PickupLocationForm
                requestId={req.id}
                onUpdated={(d) => setReq(d)}
              />
            )}
            {req.status === 'matched' && req.shipping_method === 'pickup_point' && !req.pickup_location && !isRequester && (
              <div className="card p-4 bg-ink-50">
                <p className="text-sm text-ink-700">
                  Aguardando o solicitante descrever o ponto de retirada…
                </p>
              </div>
            )}

            {/* Helper anexa tracking */}
            {req.status === 'matched' && req.shipping_method && (req.shipping_address_json || req.pickup_location) && !isRequester && isAcceptedHelper && (
              <>
                <ShippingAddressDisplay
                  method={req.shipping_method}
                  address={req.shipping_address_json}
                  pickupLocation={req.pickup_location}
                />
                <TrackingForm requestId={req.id} onUpdated={(d) => setReq(d)} />
              </>
            )}
            {req.status === 'matched' && req.shipping_method && (req.shipping_address_json || req.pickup_location) && isRequester && (
              <div className="card p-4 bg-ink-50">
                <p className="text-sm text-ink-700">
                  Endereço informado. Aguardando o helper postar e adicionar o código de rastreio…
                </p>
              </div>
            )}

            {/* In transit: ambos veem tracking */}
            {req.status === 'in_transit' && req.tracking_code && (
              <TrackingDisplay
                requestId={req.id}
                trackingCode={req.tracking_code}
                isRequester={isRequester}
                onUpdated={(d) => setReq(d)}
              />
            )}

            {/* Delivered: badge final */}
            {req.status === 'delivered' && (
              <div className="card p-5 bg-leaf-50 border-leaf-200">
                <div className="font-display font-semibold text-leaf-700 flex items-center gap-2">
                  ✓ Entregue
                </div>
                <p className="text-sm text-ink-700 mt-1">
                  {isRequester
                    ? 'Você confirmou o recebimento. Você pode fechar o pedido a qualquer momento.'
                    : 'O solicitante confirmou o recebimento. Obrigado por iluminar uma vida!'}
                </p>
              </div>
            )}
          </div>
        )}


      {/* Chat */}
      {(canChat || req.status === 'closed') && (
        <div className="card overflow-hidden mb-6">
          <div className="bg-sky-900 text-white px-5 py-3 font-display font-semibold">
            Conversa
          </div>
          <div className="p-5 max-h-96 overflow-y-auto space-y-3 bg-ink-50/50">
            {messages.length === 0 ? (
              <p className="text-center text-ink-700 text-sm py-8">
                Comece a conversa! Lembre-se: combine pelo chat, sem trocar contatos pessoais aqui.
              </p>
            ) : messages.map(m => {
              const mine = m.sender_id === user.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                    m.is_redacted ? 'bg-red-50 text-red-700 italic' :
                    mine ? 'bg-sky-600 text-white' : 'bg-white border border-ink-200 text-ink-900'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${mine && !m.is_redacted ? 'text-sky-100' : 'text-ink-400'}`}>
                      {new Date(m.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          {canChat && (
            <form onSubmit={sendMessage} className="border-t border-ink-100 p-3 flex gap-2">
              <input type="text" maxLength={500}
                className="input-field py-2 flex-1"
                placeholder="Escreva uma mensagem (sem telefones, e-mails ou links)"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)} />
              <button type="submit" className="btn-primary py-2 px-4" disabled={!chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          )}
        </div>
      )}

      {/* Avaliação bilateral */}
      {req.status === 'closed' && (
        <div className="card p-6 mb-6">
          <h2 className="font-display font-semibold text-xl text-ink-900 mb-1 flex items-center gap-2">
            <Star size={20} className="text-sun-500" /> Avalie sua experiência
          </h2>
          <p className="font-body text-sm text-ink-700 mb-4">
            Sua avaliação é anônima e ajuda a construir confiança na rede.
          </p>

          {ratingSubmitted ? (
            <div className="flex items-center gap-2 text-leaf-600 font-body text-sm">
              <CheckCircle2 size={18} /> Você já avaliou este pedido. Obrigado!
            </div>
          ) : (
            <div className="space-y-3">
              <StarPicker value={ratingScore} onChange={setRatingScore} />
              <textarea
                rows={2}
                maxLength={300}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Comentário opcional (máx. 300 caracteres)"
                className="input-field resize-none text-sm"
              />
              <button
                onClick={submitRating}
                disabled={!ratingScore}
                className="btn-primary text-sm py-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Enviar avaliação
              </button>
            </div>
          )}

          {ratings.length > 0 && (
            <div className="mt-5 pt-5 border-t border-ink-100 space-y-3">
              <p className="text-xs font-display font-semibold uppercase tracking-wider text-ink-400">
                Avaliações deste pedido
              </p>
              {ratings.map(r => (
                <div key={r.id} className="flex items-start gap-3 text-sm">
                  <div className="flex shrink-0">
                    {[1,2,3,4,5].map(n => (
                      <Star key={n} size={14} className={n <= r.score ? 'fill-sun-400 text-sun-400' : 'text-ink-200'} />
                    ))}
                  </div>
                  <div className="text-ink-700">
                    {r.rater_id === user.id ? 'Sua avaliação' : 'Avaliação recebida'}
                    {r.comment && <span className="text-ink-500"> — {r.comment}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de denúncia */}
      {showReport && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-card max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
              <div className="flex-1">
                <h3 className="font-display font-semibold text-lg text-ink-900">Denunciar conversa</h3>
                <p className="font-body text-sm text-ink-700 mt-1">
                  A moderação vai revisar essa conversa. Conte o que aconteceu (opcional):
                </p>
              </div>
              <button onClick={() => setShowReport(false)} className="text-ink-400 hover:text-ink-700"><X size={20} /></button>
            </div>
            <textarea rows={4} maxLength={500}
              className="input-field resize-none mb-4"
              placeholder="Descreva o motivo (opcional)"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowReport(false)} className="btn-ghost">Cancelar</button>
              <button onClick={submitReport} className="btn-primary">Enviar denúncia</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-card font-body text-sm z-50 ${
          toast.kind === 'error' ? 'bg-red-500 text-white' : 'bg-leaf-500 text-white'
        }`}>{toast.msg}</div>
      )}
    </section>
  );
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Ruim', 'Regular', 'Bom', 'Muito bom', 'Excelente'];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              size={28}
              className={
                n <= (hovered || value)
                  ? 'fill-sun-400 text-sun-400'
                  : 'text-ink-200'
              }
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="font-body text-sm text-ink-700">
          {labels[hovered || value]}
        </span>
      )}
    </div>
  );
}
