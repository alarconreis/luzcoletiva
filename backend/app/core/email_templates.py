"""
Templates de e-mail — HTML + texto plain fallback.
Todos seguem identidade visual: Poppins/Open Sans, paleta sun/sky/leaf.
"""
from app.core.config import settings


def _wrap(content_html: str, preheader: str = "") -> str:
    """Layout base — header com logo, conteúdo, footer."""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Luz Coletiva</title>
</head>
<body style="margin:0;padding:0;background:#FAFAFA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#424242;">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;font-size:1px;line-height:1px;">{preheader}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#FAFAFA;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px -8px rgba(66,66,66,0.15);">
      <tr><td style="background:linear-gradient(135deg,#FFD54F 0%,#4FC3F7 55%,#81C784 100%);padding:24px;text-align:center;">
        <div style="display:inline-block;background:#fff;border-radius:14px;padding:12px 18px;">
          <div style="font-weight:700;font-size:18px;color:#212121;letter-spacing:-0.3px;">🌞 Luz Coletiva</div>
          <div style="font-size:10px;color:#616161;letter-spacing:1px;text-transform:uppercase;margin-top:2px;">Iluminando vidas juntos</div>
        </div>
      </td></tr>
      <tr><td style="padding:32px 32px 24px 32px;">
        {content_html}
      </td></tr>
      <tr><td style="background:#1565C0;padding:24px;text-align:center;color:rgba(255,255,255,0.85);font-size:12px;line-height:1.6;">
        <div style="margin-bottom:8px;">Você está recebendo este e-mail porque é membro do Luz Coletiva.</div>
        <div><a href="{settings.APP_BASE_URL}/dashboard" style="color:#FFD54F;text-decoration:none;">Acessar painel</a> · <a href="{settings.APP_BASE_URL}/como-funciona" style="color:#FFD54F;text-decoration:none;">Como funciona</a></div>
        <div style="margin-top:12px;color:rgba(255,255,255,0.6);font-size:11px;">© Luz Coletiva — Não responda a este e-mail.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>"""


def _btn(label: str, url: str, color: str = "#FFD54F", text_color: str = "#212121") -> str:
    return f'<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;"><tr><td style="background:{color};border-radius:24px;padding:0;"><a href="{url}" style="display:inline-block;padding:14px 28px;font-weight:600;color:{text_color};text-decoration:none;font-size:15px;">{label}</a></td></tr></table>'


# ----- Templates específicos -----

def welcome(name: str) -> tuple[str, str, str]:
    first = name.split()[0]
    subject = f"Bem-vindo(a), {first}! ✨"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;font-weight:700;">Olá, {first}!</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;margin:0 0 16px 0;">Sua conta no Luz Coletiva foi criada com sucesso. A partir de agora você faz parte de uma rede que ilumina vidas todos os dias.</p>
        <p style="font-size:16px;line-height:1.6;color:#616161;margin:0;">Antes de criar pedidos ou oferecer ajuda, você precisa fazer uma verificação rápida de identidade. Leva menos de 2 minutos.</p>
        {_btn("Verificar identidade", settings.APP_BASE_URL + "/verify-identity")}
        <p style="font-size:14px;color:#9E9E9E;margin-top:24px;line-height:1.5;">Com gratidão,<br>Equipe Luz Coletiva</p>
    """, preheader=f"Bem-vindo ao Luz Coletiva, {first}")
    text = f"Olá, {first}!\n\nSua conta no Luz Coletiva foi criada. Antes de criar pedidos ou oferecer ajuda, faça a verificação de identidade em {settings.APP_BASE_URL}/verify-identity\n\nEquipe Luz Coletiva"
    return subject, html, text


def verify_approved(name: str) -> tuple[str, str, str]:
    first = name.split()[0]
    subject = "Sua identidade foi verificada ✓"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Verificação aprovada!</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, sua identidade foi confirmada com sucesso. Agora você já pode criar pedidos de ajuda ou oferecer apoio na rede.</p>
        {_btn("Acessar minha conta", settings.APP_BASE_URL + "/dashboard")}
    """, preheader="Sua verificação foi aprovada")
    text = f"Olá {first}, sua verificação de identidade foi aprovada. Acesse: {settings.APP_BASE_URL}/dashboard"
    return subject, html, text


def verify_rejected(name: str, reason: str) -> tuple[str, str, str]:
    first = name.split()[0]
    subject = "Verificação não aprovada"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Sua verificação não foi aprovada</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, encontramos um problema na sua verificação:</p>
        <div style="background:#FFEBEE;border-left:3px solid #F44336;padding:12px 16px;border-radius:8px;margin:16px 0;color:#C62828;font-size:14px;">{reason}</div>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Você pode tentar novamente. Dicas: boa iluminação, foto nítida do RG inteiro, e selfie sem máscara ou óculos escuros.</p>
        {_btn("Tentar novamente", settings.APP_BASE_URL + "/verify-identity")}
    """, preheader="Não foi possível verificar sua identidade")
    text = f"Olá {first}, sua verificação não foi aprovada. Motivo: {reason}\n\nTente novamente: {settings.APP_BASE_URL}/verify-identity"
    return subject, html, text


def verify_manual(name: str) -> tuple[str, str, str]:
    first = name.split()[0]
    subject = "Sua verificação está em análise"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Em análise manual</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, sua verificação ficou em uma faixa de incerteza e nossa equipe está revisando manualmente. Você receberá uma resposta em breve.</p>
    """, preheader="Sua verificação está em análise")
    text = f"Olá {first}, sua verificação está em análise manual. Você receberá uma resposta em breve."
    return subject, html, text


def offer_received(requester_name: str, helper_name: str, request_title: str, request_id: int) -> tuple[str, str, str]:
    first = requester_name.split()[0]
    helper_first = helper_name.split()[0]
    subject = f"{helper_first} se ofereceu para ajudar você"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Alguém quer ajudar 💛</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, <strong>{helper_name}</strong> se ofereceu para ajudar com seu pedido:</p>
        <div style="background:#E1F5FE;border-radius:12px;padding:14px 18px;margin:16px 0;color:#1565C0;font-size:15px;font-weight:500;">{request_title}</div>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Você pode aceitar, recusar ou conversar antes de decidir.</p>
        {_btn("Ver oferta", settings.APP_BASE_URL + f"/help-requests/{request_id}", "#4FC3F7", "#fff")}
    """, preheader=f"{helper_first} quer ajudar você")
    text = f"Olá {first}, {helper_name} se ofereceu para ajudar com '{request_title}'. Veja em {settings.APP_BASE_URL}/help-requests/{request_id}"
    return subject, html, text


def offer_accepted(helper_name: str, request_title: str, request_id: int) -> tuple[str, str, str]:
    first = helper_name.split()[0]
    subject = "Sua oferta foi aceita ✓"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Oferta aceita!</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, sua oferta para o pedido foi aceita:</p>
        <div style="background:#E8F5E9;border-radius:12px;padding:14px 18px;margin:16px 0;color:#1B5E20;font-size:15px;font-weight:500;">{request_title}</div>
        <p style="font-size:16px;line-height:1.6;color:#616161;">O chat agora está aberto. Combine os detalhes e lembre-se: nada de telefones, e-mails ou links — tudo pelo chat seguro.</p>
        {_btn("Abrir conversa", settings.APP_BASE_URL + f"/help-requests/{request_id}", "#81C784", "#fff")}
    """, preheader="Sua oferta foi aceita")
    text = f"Olá {first}, sua oferta foi aceita! Abra a conversa em {settings.APP_BASE_URL}/help-requests/{request_id}"
    return subject, html, text


def offer_declined(helper_name: str, request_title: str) -> tuple[str, str, str]:
    first = helper_name.split()[0]
    subject = "Sua oferta foi recusada"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">Oferta não foi aceita</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, o solicitante decidiu não aceitar sua oferta para:</p>
        <div style="background:#F5F5F5;border-radius:12px;padding:14px 18px;margin:16px 0;color:#616161;font-size:15px;">{request_title}</div>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Não desanime — tem muita gente precisando de apoio. Veja outros pedidos abertos:</p>
        {_btn("Ver pedidos abertos", settings.APP_BASE_URL + "/help-requests")}
    """, preheader="Sua oferta foi recusada")
    text = f"Olá {first}, sua oferta para '{request_title}' não foi aceita. Veja outros pedidos: {settings.APP_BASE_URL}/help-requests"
    return subject, html, text


def chat_messages_pending(recipient_name: str, request_title: str, request_id: int, count: int) -> tuple[str, str, str]:
    first = recipient_name.split()[0]
    subject = f"Você tem {count} mensagem{'s' if count > 1 else ''} no chat"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;">{count} mensagem{'s nova(s)' if count > 1 else ' nova'} 💬</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, você recebeu mensagens no chat de:</p>
        <div style="background:#FFF8E1;border-radius:12px;padding:14px 18px;margin:16px 0;color:#5D4037;font-size:15px;font-weight:500;">{request_title}</div>
        {_btn("Abrir conversa", settings.APP_BASE_URL + f"/help-requests/{request_id}")}
    """, preheader=f"{count} mensagem(s) nova(s) no chat")
    text = f"Olá {first}, você tem {count} mensagem(s) nova(s) sobre '{request_title}'. Abra: {settings.APP_BASE_URL}/help-requests/{request_id}"
    return subject, html, text


def admin_report(reporter_email: str, request_id: int, reason: str | None) -> tuple[str, str, str]:
    subject = f"[ADMIN] Nova denúncia no pedido #{request_id}"
    html = _wrap(f"""
        <h1 style="font-size:22px;color:#212121;margin:0 0 16px 0;">⚠️ Denúncia recebida</h1>
        <p style="font-size:14px;color:#616161;line-height:1.6;"><strong>Reporter:</strong> {reporter_email}<br><strong>Pedido:</strong> #{request_id}</p>
        <div style="background:#FFEBEE;border-radius:12px;padding:14px 18px;margin:12px 0;color:#C62828;font-size:14px;">
            <strong>Motivo:</strong><br>{reason or '(sem descrição)'}
        </div>
        {_btn("Abrir painel admin", settings.APP_BASE_URL + "/admin", "#1565C0", "#fff")}
    """, preheader="Nova denúncia precisa de revisão")
    text = f"Denúncia recebida no pedido #{request_id}. Reporter: {reporter_email}. Motivo: {reason or 'sem descrição'}. Veja: {settings.APP_BASE_URL}/admin"
    return subject, html, text


def admin_verify_pending(count: int) -> tuple[str, str, str]:
    subject = f"[ADMIN] {count} verificação(ões) aguardando revisão"
    html = _wrap(f"""
        <h1 style="font-size:22px;color:#212121;margin:0 0 16px 0;">Fila de verificações</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Há <strong>{count}</strong> verificação(ões) de identidade aguardando revisão manual no painel.</p>
        {_btn("Abrir painel admin", settings.APP_BASE_URL + "/admin", "#1565C0", "#fff")}
    """, preheader=f"{count} verificações pendentes")
    text = f"{count} verificação(ões) aguardando revisão em {settings.APP_BASE_URL}/admin"
    return subject, html, text


def password_reset(name: str, reset_url: str) -> tuple[str, str, str]:
    first = name.split()[0]
    subject = "Redefinição de senha — Luz Coletiva"
    html = _wrap(f"""
        <h1 style="font-size:24px;color:#212121;margin:0 0 16px 0;font-weight:700;">Redefinir senha</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Olá {first}, recebemos uma solicitação para redefinir a senha da sua conta no Luz Coletiva.</p>
        <p style="font-size:16px;line-height:1.6;color:#616161;">Clique no botão abaixo. O link é válido por <strong>30 minutos</strong>.</p>
        {_btn("Redefinir minha senha", reset_url, "#4FC3F7", "#fff")}
        <p style="font-size:14px;color:#9E9E9E;margin-top:16px;line-height:1.5;">Se você não solicitou a redefinição, ignore este e-mail — sua senha continua a mesma.</p>
    """, preheader="Redefina sua senha no Luz Coletiva")
    text = f"Olá {first}, redefina sua senha em: {reset_url}\n\nO link expira em 30 minutos. Se não foi você, ignore este e-mail."
    return subject, html, text


def admin_backup_failed(error_excerpt: str) -> tuple[str, str, str]:
    subject = "[ADMIN] ⚠️ Backup do Postgres falhou"
    html = _wrap(f"""
        <h1 style="font-size:22px;color:#212121;margin:0 0 16px 0;">⚠️ Falha no backup</h1>
        <p style="font-size:16px;line-height:1.6;color:#616161;">O backup automático do Postgres falhou na última execução.</p>
        <pre style="background:#212121;color:#FFD54F;padding:14px;border-radius:8px;font-size:12px;overflow-x:auto;white-space:pre-wrap;">{error_excerpt}</pre>
        <p style="font-size:14px;color:#616161;line-height:1.6;">Verifique <code>/var/log/luz-backup.log</code> na VPS para detalhes.</p>
    """, preheader="Backup falhou — verificar log")
    text = f"Backup falhou. Trecho do erro:\n{error_excerpt}\n\nVerifique /var/log/luz-backup.log na VPS."
    return subject, html, text



# ============================================
# Templates de logística (Fase 2)
# ============================================

def shipping_method_chosen(requester_name: str, method: str, request_title: str, request_id: int):
    from app.core.config import settings
    base = settings.APP_BASE_URL
    method_label = "Correios (PAC ou Sedex)" if method == "correios" else "Ponto de retirada"
    next_step = (
        "Preencha seu endereço de entrega na plataforma para o helper enviar pelos Correios."
        if method == "correios"
        else "Descreva o ponto de retirada que você prefere (ex: agência dos Correios próxima)."
    )
    subject = "[Luz Coletiva] Próximo passo: informar local para entrega"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#212121;">
      <h2 style="color:#1565C0;margin:0 0 16px;">Olá, {requester_name}!</h2>
      <p>O helper aceito do seu pedido <strong>{request_title}</strong> escolheu o método de entrega:</p>
      <p style="background:#E1F5FE;padding:12px;border-radius:8px;font-weight:600;">{method_label}</p>
      <p>{next_step}</p>
      <p style="margin-top:24px;">
        <a href="{base}/help-requests/{request_id}" style="background:#1565C0;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Acessar pedido</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#757575;">Luz Coletiva — Iluminando vidas juntos</p>
    </div>
    """
    text = f"Olá {requester_name}, o helper escolheu {method_label}. {next_step} Acesse: {base}/help-requests/{request_id}"
    return subject, html, text


def shipping_address_provided(helper_name: str, method: str, request_title: str, request_id: int):
    from app.core.config import settings
    base = settings.APP_BASE_URL
    next_step = (
        "Acesse o pedido para ver o endereço completo, comprar a etiqueta dos Correios e anexar o código de rastreio."
        if method == "correios"
        else "Acesse o pedido para ver o ponto de retirada combinado e enviar para lá."
    )
    subject = "[Luz Coletiva] Endereço informado — pronto para envio"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#212121;">
      <h2 style="color:#1565C0;margin:0 0 16px;">Olá, {helper_name}!</h2>
      <p>O solicitante do pedido <strong>{request_title}</strong> informou o local para entrega.</p>
      <p>{next_step}</p>
      <p style="background:#FFF8E1;padding:12px;border-radius:8px;font-size:13px;color:#5D4037;">
        <strong>Lembrete:</strong> ao escolher Correios, você se compromete a pagar o frete (R$ 15–35 típico, varia com peso e distância).
      </p>
      <p style="margin-top:24px;">
        <a href="{base}/help-requests/{request_id}" style="background:#1565C0;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Acessar pedido</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#757575;">Luz Coletiva — Iluminando vidas juntos</p>
    </div>
    """
    text = f"Olá {helper_name}, o solicitante informou o local. {next_step} Acesse: {base}/help-requests/{request_id}"
    return subject, html, text


def package_shipped(requester_name: str, tracking_code: str, request_title: str, request_id: int):
    from app.core.config import settings
    base = settings.APP_BASE_URL
    correios_url = f"https://www.linkcorreios.com.br/?id={tracking_code}"
    subject = f"[Luz Coletiva] Pedido enviado! Código: {tracking_code}"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#212121;">
      <h2 style="color:#81C784;margin:0 0 16px;">Olá, {requester_name}! Pedido a caminho</h2>
      <p>O helper enviou o item do seu pedido <strong>{request_title}</strong>.</p>
      <p style="background:#E8F5E9;padding:16px;border-radius:8px;">
        <strong>Código de rastreio:</strong><br>
        <span style="font-family:monospace;font-size:18px;letter-spacing:1px;">{tracking_code}</span>
      </p>
      <p>Acompanhe diretamente nos Correios:</p>
      <p>
        <a href="{correios_url}" style="background:#FFD54F;color:#212121;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Rastrear nos Correios</a>
      </p>
      <p style="margin-top:24px;">Quando o pedido chegar, lembre de confirmar o recebimento na plataforma:</p>
      <p>
        <a href="{base}/help-requests/{request_id}" style="background:#1565C0;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Confirmar recebimento</a>
      </p>
      <p style="margin-top:16px;font-size:13px;color:#5D4037;">
        Se em 7 dias você não confirmar, o pedido é fechado automaticamente.
      </p>
      <p style="margin-top:24px;font-size:12px;color:#757575;">Luz Coletiva — Iluminando vidas juntos</p>
    </div>
    """
    text = f"Olá {requester_name}, pedido enviado. Rastreio: {tracking_code}. Confirme em {base}/help-requests/{request_id}"
    return subject, html, text


def delivery_confirmed(helper_name: str, request_title: str, request_id: int):
    from app.core.config import settings
    base = settings.APP_BASE_URL
    subject = "[Luz Coletiva] Recebimento confirmado — obrigado!"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#212121;">
      <h2 style="color:#81C784;margin:0 0 16px;">Olá, {helper_name}! Recebimento confirmado</h2>
      <p>O solicitante do pedido <strong>{request_title}</strong> confirmou que recebeu o item.</p>
      <p style="background:#E8F5E9;padding:16px;border-radius:8px;">
        Obrigado por iluminar a vida de alguém. Sua ajuda chegou.
      </p>
      <p style="margin-top:24px;">
        <a href="{base}/help-requests/{request_id}" style="background:#1565C0;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Acessar pedido</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#757575;">Luz Coletiva — Iluminando vidas juntos</p>
    </div>
    """
    text = f"Olá {helper_name}, o solicitante confirmou o recebimento. Obrigado por iluminar uma vida! {base}/help-requests/{request_id}"
    return subject, html, text


def delivery_auto_confirmed(name: str, request_title: str, request_id: int):
    from app.core.config import settings
    base = settings.APP_BASE_URL
    subject = "[Luz Coletiva] Pedido fechado automaticamente após 7 dias"
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;color:#212121;">
      <h2 style="color:#1565C0;margin:0 0 16px;">Olá, {name}!</h2>
      <p>O pedido <strong>{request_title}</strong> foi marcado como entregue automaticamente, pois passaram 7 dias desde o envio sem confirmação manual.</p>
      <p>Se houver algum problema com o item, entre em contato pelo chat ou abra uma denúncia.</p>
      <p style="margin-top:24px;">
        <a href="{base}/help-requests/{request_id}" style="background:#1565C0;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Acessar pedido</a>
      </p>
      <p style="margin-top:24px;font-size:12px;color:#757575;">Luz Coletiva — Iluminando vidas juntos</p>
    </div>
    """
    text = f"Olá {name}, o pedido {request_title} foi auto-confirmado após 7 dias. Acesse: {base}/help-requests/{request_id}"
    return subject, html, text
