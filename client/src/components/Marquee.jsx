// Endlessly scrolling strip of subject names (pure CSS animation).
const NAMES = [
  'Data Structures', 'Operating Systems', 'Computer Networks', 'Digital Signal Processing', 'Database Management Systems',
  'Compiler Design', 'Power Electronics', 'Electromagnetic Field Theory', 'Theory of Computation', 'Analog Communications',
  'Discrete Mathematics', 'Software Engineering', 'Microelectronics', 'Web Technologies', 'Applied Physics', 'Control Systems',
];

export default function Marquee() {
  const row = NAMES.map((n) => <span key={n}>{n}</span>);
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">{row}{row}</div>
    </div>
  );
}
