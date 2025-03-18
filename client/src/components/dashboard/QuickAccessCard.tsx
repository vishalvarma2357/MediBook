import { useLocation } from "wouter";

interface QuickAccessCardProps {
  icon: string;
  title: string;
  link: string;
}

export default function QuickAccessCard({ icon, title, link }: QuickAccessCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(link);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col items-center justify-center bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-100 cursor-pointer"
    >
      <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-3">
        <i className={`${icon} text-primary text-xl`}></i>
      </div>
      <span className="text-sm font-medium text-center">{title}</span>
    </div>
  );
}
