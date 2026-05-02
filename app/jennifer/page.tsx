import { permanentRedirect } from "next/navigation";

export default function RemovedCreatorRoute() {
  permanentRedirect("/");
}
