import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldOff, QrCode, Key, AlertTriangle, Copy, CheckCircle } from 'lucide-react';
import api from '../../services/api.js';

export default function SecurityTab() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Setup flow
  const [setupQR, setSetupQR] = useState(null);
  const [setupSecret, setSetupSecret] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Backup codes display (one-time)
  const [backupCodes, setBackupCodes] = useState(null);
  const [codesAck, setCodesAck] = useState(false);

  // Disable flow
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableCode, setDisableCode] = useState('');

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/me/totp/status');
      setStatus(data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStatus(); }, []);

  const showOk = (m) => { setSuccess(m); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (m) => { setError(m); setTimeout(() => setError(''), 5000); };

  const startSetup = async () => {
    setError('');
    setSetupCode('');
    try {
      const { data } = await api.post('/admin/me/totp/setup');
      setSetupQR(data.qr_code_base64);
      setSetupSecret(data.secret);
      setShowSetupModal(true);
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao iniciar setup');
    }
  };

  const confirmSetup = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(setupCode)) {
      showErr('Código deve ter 6 dígitos');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/admin/me/totp/confirm', { code: setupCode });
      setBackupCodes(data.backup_codes);
      setShowSetupModal(false);
      setSetupQR(null);
      setSetupSecret('');
      setSetupCode('');
      showOk('TOTP ativado com sucesso');
    } catch (e) {
      showErr(e.response?.data?.detail || 'Código inválido');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisable = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/me/totp/disable', {
        password: disablePassword,
        code: disableCode,
      });
      setShowDisableModal(false);
      setDisablePassword('');
      setDisableCode('');
      showOk('TOTP desativado. Login agora usa SMS.');
      loadStatus();
    } catch (e) {
      showErr(e.response?.data?.detail || 'Erro ao desativar');
    } finally {
      setSubmitting(false);
    }
  };

  const acknowledgeBackupCodes = () => {
    setBackupCodes(null);
    setCodesAck(false);
    loadStatus();
  };

  const copyCodes = () => {
    const text = backupCodes.join('\n');
    navigator.clipboard.writeText(text).then(() => showOk('Códigos copiados'));
  };

  if (loading) return <div className="card p-8">Carregando...</div>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h2 className="font-display font-semibold text-ink-900 text-2xl flex items-center gap-2">
          <Shield size={24} /> Segurança da conta
        </h2>
        <p className="font-body text-sm text-ink-700 mt-1">
          Configurações de autenticação em 2 fatores para sua conta de administrador.
        </p>
      </div>

      {error && <div className="card p-3 bg-red-50 border-red-200 text-red-700 text-sm">{error}</div>}
      {success && <div className="card p-3 bg-leaf-50 border-leaf-200 text-leaf-700 text-sm">{success}</div>}

      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="font-display font-semibold text-ink-900 text-lg flex items-center gap-2">
              {status?.enabled ? (
                <>
                  <ShieldCheck className="text-leaf-600" size={20} /> TOTP ativo
                </>
              ) : (
                <>
                  <ShieldOff className="text-ink-500" size={20} /> TOTP inativo
                </>
              )}
            </h3>
            <p className="font-body text-sm text-ink-700 mt-1">
              {status?.enabled
                ? 'Login requer código do Google Authenticator (ou app TOTP compatível).'
                : 'Login está usando SMS OTP via celular. Ative TOTP para maior segurança.'}
            </p>
            {status?.enabled && status.enabled_at && (
              <p className="text-xs text-ink-600 mt-2">
                Ativo desde: {new Date(status.enabled_at).toLocaleString('pt-BR')}
              </p>
            )}
            {status?.enabled && (
              <p className={`text-xs mt-1 ${status.backup_codes_remaining < 3 ? 'text-amber-700' : 'text-ink-600'}`}>
                Backup codes restantes: <strong>{status.backup_codes_remaining}</strong>
                {status.backup_codes_remaining < 3 && ' ⚠ baixo'}
              </p>
            )}
          </div>
          <div>
            {status?.enabled ? (
              <button onClick={() => setShowDisableModal(true)} className="btn-ghost text-sm text-red-700">
                Desativar
              </button>
            ) : (
              <button onClick={startSetup} className="btn-primary text-sm">
                Ativar TOTP
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card p-5 bg-sky-50 border-sky-200">
        <h3 className="font-display font-semibold text-ink-900 mb-2">Sobre TOTP</h3>
        <ul className="text-sm text-ink-800 space-y-1 leading-relaxed">
          <li>• Códigos rotativos de 6 dígitos a cada 30 segundos</li>
          <li>• Funciona offline (não precisa internet no celular)</li>
          <li>• Imune a SIM swap e interceptação SMS</li>
          <li>• Compatível com Google Authenticator, Authy, 1Password, Bitwarden</li>
        </ul>
      </div>

      {showSetupModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="font-display font-semibold text-ink-900 text-xl mb-4 flex items-center gap-2">
                <QrCode size={22} /> Ativar TOTP
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-ink-700 mb-3">
                    1. Abra o Google Authenticator e escaneie o QR:
                  </p>
                  <div className="flex justify-center bg-white p-4 border-2 border-ink-200 rounded-lg">
                    <img src={`data:image/png;base64,${setupQR}`} alt="QR TOTP" className="w-56 h-56" />
                  </div>
                </div>

                <details className="text-xs">
                  <summary className="cursor-pointer text-ink-700 hover:text-ink-900">
                    Não consegue escanear? Digite o código manualmente
                  </summary>
                  <div className="mt-2 p-3 bg-ink-50 rounded font-mono text-sm break-all">
                    {setupSecret}
                  </div>
                </details>

                <form onSubmit={confirmSetup}>
                  <p className="text-sm text-ink-700 mb-2 mt-4">
                    2. Digite o código de 6 dígitos que aparece no app:
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    placeholder="000000"
                    value={setupCode}
                    onChange={e => setSetupCode(e.target.value.replace(/\D/g, ''))}
                    className="input-field text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button type="button" onClick={() => setShowSetupModal(false)} className="btn-ghost">
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={submitting || setupCode.length !== 6}>
                      {submitting ? 'Validando...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {backupCodes && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="font-display font-semibold text-ink-900 text-xl mb-2 flex items-center gap-2">
                <Key className="text-amber-600" size={22} /> Backup codes
              </h3>
              <div className="card p-3 bg-amber-50 border-amber-200 mb-4 flex gap-2 items-start">
                <AlertTriangle className="text-amber-700 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Salve esses códigos agora!</strong> Eles não serão exibidos novamente. Use cada um apenas uma vez quando não tiver acesso ao seu app autenticador.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 font-mono text-sm">
                {backupCodes.map((c, i) => (
                  <div key={i} className="bg-ink-50 p-2 rounded text-center tracking-wider">{c}</div>
                ))}
              </div>

              <button onClick={copyCodes} className="btn-ghost text-sm w-full mb-3 flex items-center justify-center gap-2">
                <Copy size={14} /> Copiar todos
              </button>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={codesAck} onChange={e => setCodesAck(e.target.checked)} />
                Confirmo que salvei os códigos em local seguro
              </label>

              <div className="flex justify-end gap-2 mt-4">
                <button onClick={acknowledgeBackupCodes} className="btn-primary" disabled={!codesAck}>
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDisableModal && (
        <div className="fixed inset-0 bg-ink-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="font-display font-semibold text-ink-900 text-xl mb-3 flex items-center gap-2">
                <ShieldOff size={22} /> Desativar TOTP
              </h3>
              <p className="text-sm text-ink-700 mb-4">
                Volta a usar SMS OTP. Confirma com sua senha + código TOTP atual.
              </p>
              <form onSubmit={confirmDisable} className="space-y-3">
                <input
                  type="password"
                  placeholder="Sua senha"
                  value={disablePassword}
                  onChange={e => setDisablePassword(e.target.value)}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  placeholder="Código TOTP atual"
                  value={disableCode}
                  onChange={e => setDisableCode(e.target.value.replace(/\D/g, ''))}
                  className="input-field text-center text-xl tracking-widest font-mono"
                  required
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowDisableModal(false)} className="btn-ghost">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? 'Desativando...' : 'Desativar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
