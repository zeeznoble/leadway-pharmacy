export type BrandProps = {
  className?: string;
};

export default function Brand({ className }: BrandProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <img
        src={"/leadway-logo.png"}
        alt="leadway-logo"
        className={className ? className : "w-44"}
      />
    </div>
  );
}
