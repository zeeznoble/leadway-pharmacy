import leadwayLogo from "/leadway-logo.png";

export default function LandingLeft() {
  return (
    <div className="flex-1 left-image sm:flex hidden">
      <div className="flex w-full h-full flex-col justify-between p-10">
        <img src={leadwayLogo} alt="leadway_logo" className="w-52" />
        <div>
          <h2 className="text-3xl font-bold text-white">
            The Smarter Choice is Here...
          </h2>
        </div>
      </div>
    </div>
  );
}
