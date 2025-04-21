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
  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${color}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <p className="text-2xl font-semibold mt-1">
            {value.toLocaleString()}
          </p>
        </div>
        <div
          className={`text-${color.replace("border-l-", "")} text-opacity-80`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
