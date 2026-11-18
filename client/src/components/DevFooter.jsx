import './devfooter.css';
import { Link } from 'react-router-dom';

export default function DevFooter() {
  return (
    <footer className="devfooter">
      <Link className="devfooter-link" to="/contributors">Contributors</Link>
    </footer>
  );
}
