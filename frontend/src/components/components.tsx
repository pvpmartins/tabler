import React from "react";

type SelectProps = {
  options: { value: string; label: string }[];
  onChange?: (value: string) => void;
  value?: string
};

export const Select: React.FC<SelectProps> = ({ options, onChange, value }) => (
  <select value={value} className="select" onChange={(e) => onChange && onChange(e.target.value)}>
    {options.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export const Card: React.FC<CardProps> = ({ children, className = "" }) => (
  <div className={`card ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="card-content">{children}</div>
);

type SwitchProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export const Switch: React.FC<SwitchProps> = ({ checked = false, onChange }) => {
  const [isChecked, setIsChecked] = React.useState(checked);

  const toggleSwitch = () => {
    setIsChecked(!isChecked);
    if (onChange) onChange(!isChecked);
  };

  return (
    <div className="switch" onClick={toggleSwitch}>
      <div className={`switch-thumb ${isChecked ? "checked" : ""}`}></div>
    </div>
  );
};

type ButtonProps = {
  children: React.ReactNode;
  variant?: "default" | "destructive";
  onClick?: () => void;
};

export const Button: React.FC<ButtonProps> = ({ children, variant = "default", onClick }) => (
  <button className={`button ${variant}`} onClick={onClick}>{children}</button>
);

type InputProps = {
  type?: string;
  placeholder?: string;
};

export const Input: React.FC<InputProps> = ({ type = "text", placeholder = "" }) => (
  <input className="input" type={type} placeholder={placeholder} />
);
