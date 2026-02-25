interface NavTabProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

const NavTab = ({ children, active, onClick }: NavTabProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium transition-colors ${
      active
        ? 'text-primary border-b-2 border-primary'
        : 'text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export default NavTab;
