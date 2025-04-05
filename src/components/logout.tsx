import { useNavigate } from "react-router-dom";

import { Button } from "@heroui/button";

export default function Logout() {
  const navigate = useNavigate();

  return (
    <div className="flex justify-center mt-4">
      <Button color="danger" onPress={() => navigate("/")}>
        Logout
      </Button>
    </div>
  );
}
