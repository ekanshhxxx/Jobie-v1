// @ts-nocheck
type Props = {
  title: string;
  value: number;
  icon: React.ReactNode;
};

export default function StatsCard({ title, value, icon }: Props) {
  return (
    <div className="flex-1 bg-[#F8FAFC] border border-[#E5E7EB] p-6 rounded-xl flex justify-between items-center">

      <div>

        <p className="text-[#6B7280] text-sm">
          {title}
        </p>

        <h2 className="text-3xl font-bold text-[#111827] mt-2">
          {value}
        </h2>

      </div>

      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563EB]">
        {icon}
      </div>

    </div>
  );
}


