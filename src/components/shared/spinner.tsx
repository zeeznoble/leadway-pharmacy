import { Spinner as HeroUISpinner } from "@heroui/spinner";

export default function Spinner() {
  return (
    <div className="flex justify-center items-center h-screen">
      <HeroUISpinner color="warning" size="lg" />
    </div>
  );
}
