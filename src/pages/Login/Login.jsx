import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './Login.scss';

function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch {
      setError('البريد الإلكتروني أو كلمة السر غير صحيحة');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__brand">
        <div className="login-page__brand-content">
          <div className="login-page__logo">
            <Stethoscope size={28} />
            <span>CuraDesk Lite</span>
          </div>
          <h1>نظام إدارة عيادة متكامل</h1>
          <p>منصة واحدة لإدارة المرضى والمواعيد والسجلات الطبية بكل سهولة وأمان.</p>
        </div>
      </div>

      <div className="login-page__form-side">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>تسجيل الدخول</h2>
          <p className="login-form__subtitle">أدخل بياناتك للوصول إلى لوحة التحكم</p>

          <div className="login-form__field">
            <label>البريد الإلكتروني</label>
            <div className="login-form__input-wrapper">
              <Mail size={18} />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="example@clinic.com"
                required
              />
            </div>
          </div>

          <div className="login-form__field">
            <label>كلمة السر</label>
            <div className="login-form__input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && <p className="login-form__error">{error}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'جارِ الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;