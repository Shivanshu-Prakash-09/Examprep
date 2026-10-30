export default function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="tick">✓</div>
        <h3>{title}</h3>
        {children}
        <button className="btn btn-primary" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}
