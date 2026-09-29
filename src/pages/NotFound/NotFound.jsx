import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import './NotFound.scss';

function NotFound() {
  return (
    <div className="not-found-page">
      <Compass size={48} />
      <h1>404</h1>
      <p>هاي الصفحة مش موجودة أو تم نقلها</p>
      <Link to="/dashboard" className="btn-primary">
        الرجوع للوحة التحكم
      </Link>
    </div>
  );
}

export default NotFound;
