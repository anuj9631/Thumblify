import { useState } from "react";
import { useParams } from "react-router-dom";
import type { IThumbnail } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";

const Generate = () => {
  const { id } = useParams();
  const [title, seTitle] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [thumbnail, setThumbnail] = useState<IThumbnail | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <>
      <SoftBackdrop />
      <div className="pt-24 min-h-screen">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
          <div className="grid lg:grid-cols-[400px_1fr] gap-8">
            {/*LEFT Panel */}
            <div></div>
            {/*Right Panel */}
            <div></div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Generate;
