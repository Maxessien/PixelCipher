import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

// Icons
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

const EncodeSection = () => {
  const [formInfo, setFormInfo] = useState<{
    image: FileList | [];
    text: string;
  }>({ image: [], text: "" });

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [maxMessageLength, setMaxMessageLength] = useState(
    formInfo.image?.[0]?.size && formInfo.image?.[0]?.size - 88 - 512 > 0 ? formInfo.image?.[0]?.size - 88 - 512 : 0
  );

  useEffect(() => {
    const setM = () => {
      setMaxMessageLength(
        formInfo.image?.[0]?.size && formInfo.image?.[0]?.size - 88 - 512 > 0 ? formInfo.image?.[0]?.size - 88 - 512 : 0
      );
    };
    setM();
  }, [formInfo]);
  const validateFormInfo = (): boolean => {
    // Require both a real file and a non-empty message before encoding.
    const imagePresent =
      formInfo.image.length > 0 && formInfo.image?.[0] instanceof File;
    const textValid = formInfo.text?.trim()?.length > 0;

    return imagePresent && textValid;
  };

  const { isPending, mutateAsync } = useMutation<ArrayBuffer>({
    mutationFn: async () => {
      const formValid = validateFormInfo();
      if (!formValid) throw new Error("Invalid form data");
      const formData = new FormData();
      formData.append("image", formInfo.image?.[0]);
      formData.append("text", formInfo.text);
      const res = await axios.post<ArrayBuffer>("/encode", formData, {
        responseType: "arraybuffer",
      });
      return res.data;
    },
    onSuccess: (data: ArrayBuffer) => {
      // Trigger a client-side download of the encoded image bytes.
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([data], { type: "image/png" }));
      link.download = "encoded " + formInfo.image?.[0].name;
      link.click();
      toast.success("Download started");
    },
    onError: () => {
      toast.error("Download Failed");
    },
  });

  return (
    <section className="w-full max-w-5xl mx-auto flex flex-col pb-8">
      <div className="mb-8 text-center pt-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-2">
          Encode Message
        </h2>
        <p className="text-gray-500 text-sm md:text-base">Hide your secret message securely inside an image.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 px-2 sm:px-5 lg:px-8">
        <div className="flex flex-col gap-4 flex-1">
          <div className="relative group w-full h-64 border-2 border-gray-300 border-dashed rounded-2xl overflow-hidden hover:border-teal-500 hover:bg-teal-50/30 transition-all duration-300 bg-gray-50/50 flex flex-col items-center justify-center cursor-pointer shadow-sm" onClick={() => imageInputRef?.current?.click()}>
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
        </div>
        <div className="flex flex-col gap-4 flex-1">
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-64 md:h-auto focus-within:border-teal-500 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all duration-300">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">Message To Encode</h3>
              {formInfo.text.length > 0 && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-md ${formInfo.text.length >= maxMessageLength ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'}`}>
                  {formInfo.text.length} / {maxMessageLength}
                </span>
              )}
            </div>
            <textarea
              onChange={({ target: { value } }) => {
                if (formInfo.text.length >= maxMessageLength && value.length > formInfo.text.length) return;
                setFormInfo((state) => ({ ...state, text: value }));
              }}
              value={formInfo.text}
              placeholder="Enter your secret message here..."
              name="encode_text"
              id="encode_text_id"
              className="flex-1 p-4 w-full h-full resize-none outline-none text-gray-700 text-base font-medium placeholder:text-gray-300 bg-transparent"
            ></textarea>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center px-2 sm:px-5 max-w-sm mx-auto w-full">
        <p className="text-sm text-gray-500 mb-3 flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Max capacity: {maxMessageLength} characters
        </p>
        <button
          disabled={isPending || !validateFormInfo()}
          onClick={() => mutateAsync()}
          className="w-full px-4 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] transition-all duration-200 text-white font-semibold shadow-md disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {isPending ? (
            <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
          ) : (
            <>
              Encode & Save Image
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </>
          )}
        </button>
      </div>
    </section>
  );
};

export default EncodeSection;
