import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRef, useState } from "react";
import { toast } from "react-toastify";

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

const DecodeSection = () => {
  const [formInfo, setFormInfo] = useState<{
    image: FileList | [];
  }>({ image: [] });
  const [displayText, setDisplayText] = useState({
    decoded: "",
    copyText: "Copy to Clipboard",
  });

  const imageInputRef = useRef<HTMLInputElement>(null);

  const validateFormInfo = (): boolean => {
    // Decoding only needs one uploaded image.
    const imagePresent =
      formInfo.image.length > 0 && formInfo.image?.[0] instanceof File;

    return imagePresent;
  };

  const { isPending, mutateAsync } = useMutation<{text: string}>({
    mutationFn: async () => {
      const formValid = validateFormInfo();
      if (!formValid) throw new Error("Invalid form data");
      const formData = new FormData();
      formData.append("image", formInfo.image?.[0]);
      const res = await axios.post<{text: string}>("/decode", formData);
      return res.data;
    },
    onSuccess: (data) => {
      setDisplayText((state) => ({ ...state, decoded: data.text }));
      toast.success("Image Decoded");
    },
    onError: (err) => {
      if ((err as AxiosError<{message: string}>).response?.data?.message === "Unrecognised encoding")
        toast.error("No message has been encoded into this image");
      else toast.error("Decoding Failed");
    },
  });

  return (
    <section className="w-full max-w-5xl mx-auto pb-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Decode Message
          </h2>
          <p className="text-gray-500 text-sm md:text-base">Upload an encoded image to reveal its hidden secret.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 px-6 lg:px-8">
          <div className="flex flex-col gap-4 flex-1">
            <div className="relative group w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl overflow-hidden hover:border-teal-500 hover:bg-teal-50/30 transition-all duration-300 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer shadow-sm" onClick={() => imageInputRef.current?.click()}>
              {formInfo.image?.length > 0 && formInfo.image instanceof FileList ? (
                <>
                  <img
                    src={URL.createObjectURL(formInfo.image?.[0])}
                    className="object-cover w-full h-full object-center transition-transform duration-500 group-hover:scale-105"
                    alt={formInfo.image?.[0]?.name}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                     <span className="text-white font-medium px-4 py-2 bg-black/50 rounded-lg backdrop-blur-sm">Change Image</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 group-hover:text-teal-600 transition-colors duration-300">
                  <div className="p-4 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300">
                    <UploadIcon />
                  </div>
                  <span className="font-medium text-gray-700">Click to upload or drag and drop</span>
                  <span className="text-sm mt-1">PNG, JPG, BMP</span>
                </div>
              )}
            </div>
            <input
              ref={imageInputRef}
              onChange={({ target: { files } }) => {
                setFormInfo((state) => ({ ...state, image: files ?? [] }));
              }}
              className="hidden"
              type="file"
            />

            <button
              onClick={() => mutateAsync()}
              disabled={isPending || !validateFormInfo()}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 text-white font-semibold shadow-md disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : "Decode Image"}
            </button>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-64 md:h-auto">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                 <h3 className="font-semibold text-gray-700">Hidden Message Result</h3>
              </div>
              <textarea 
                readOnly 
                value={displayText.decoded} 
                className="flex-1 p-4 w-full h-full resize-none outline-none text-gray-700 text-base font-medium placeholder:text-gray-300 placeholder:font-normal bg-transparent"
                placeholder="The decoded message will appear here..."
              ></textarea>
            </div>
            
            <button
              onClick={async () => {
                const clip = window.navigator.clipboard;
                clip.writeText(displayText.decoded);
                setDisplayText((state) => ({ ...state, copyText: "Copied!" }));
                // Revert button text after a short confirmation window.
                setTimeout(() =>
                  setDisplayText((state) => ({
                    ...state,
                    copyText: "Copy to Clipboard",
                  })), 2000
                );
              }}
              disabled={!(displayText.decoded.length > 0)}
              className="mt-2 w-full px-4 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-[0.98] transition-all duration-200 text-gray-800 font-semibold shadow-sm border border-gray-200 disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-gray-100"
            >
              {displayText.copyText}
            </button>
          </div>
        </div>

    </section>
  );
};

export default DecodeSection;
