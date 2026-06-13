import './Toggle.css';

interface ToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  label?: string;
}

export default function Toggle({ active, onChange, label }: ToggleProps) {
  const classes = ['toggle', active && 'toggle--active']
    .filter(Boolean)
    .join(' ');

  return (
    <button
      className={classes}
      role="switch"
      aria-checked={active}
      aria-label={label}
      onClick={() => onChange(!active)}
    />
  );
}
