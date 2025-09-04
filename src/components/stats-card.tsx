export const StatsCard = ({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) => {
  const colorMap: Record<string, string> = {
    "border-l-blue-500": "from-blue-50 to-blue-100 border-blue-200",
    "border-l-green-500": "from-green-50 to-green-100 border-green-200",
    "border-l-purple-500": "from-purple-50 to-purple-100 border-purple-200",
    "border-l-yellow-500": "from-yellow-50 to-yellow-100 border-yellow-200",
  };

  const gradientClass =
    colorMap[color] || "from-gray-50 to-gray-100 border-gray-200";

  return (
    <div
      className={`group relative overflow-hidden bg-gradient-to-br ${gradientClass} p-6 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1`}
    >
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      <div className="relative flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-white/70 backdrop-blur-sm shadow-sm">
              {icon}
            </div>
            <h3 className="text-sm font-medium text-gray-600 tracking-wide">
              {title}
            </h3>
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-900 tracking-tight">
              {value.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
