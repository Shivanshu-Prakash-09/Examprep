// Small credit line at the bottom of every page. Edit the name / link here.
import './devfooter.css';

const NAME = 'Shivanshu Prakash';
const LINK = '';   // optional, e.g. 'https://www.linkedin.com/in/...' (makes the name clickable)

export default function DevFooter() {
  return (
    <footer className="devfooter">
      <p className="devfooter-line">
        Made with <span className="devfooter-heart" aria-label="love">♥</span> ~{' '}
        {LINK ? <a href={LINK} target="_blank" rel="noreferrer">{NAME}</a> : <span className="devfooter-name">{NAME}</span>}
      </p>
    </footer>
  );
}
