import { useRef, useState } from "react";
import "./FileUpload.css";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

function FileUpload({
  onFileSelect,
}: FileUploadProps) {

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [file, setFile] =
    useState<File | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    /*
     * Maximum 10MB
     */

    const maxFileSize =
      10 * 1024 * 1024;

    if (
      selectedFile.size >
      maxFileSize
    ) {

      alert(
        "CV file must be smaller than 10MB."
      );

      event.target.value = "";

      return;
    }

    setFile(
      selectedFile
    );

    onFileSelect(
      selectedFile
    );

  };

  const handleBrowse = () => {

    inputRef.current?.click();

  };

  const handleRemove = () => {

    setFile(null);

    /*
     * Clear the file input so the
     * same file can be selected again.
     */

    if (inputRef.current) {
      inputRef.current.value = "";
    }

  };

  return (

    <div className="file-upload">

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        onChange={
          handleFileChange
        }
        hidden
      />

      {!file ? (

        <button
          type="button"
          className="file-upload__area"
          onClick={
            handleBrowse
          }
        >

          <div className="file-upload__icon">
            ↑
          </div>

          <h3>
            Upload your CV
          </h3>

          <p>
            Drag & drop your CV here or{" "}
            <span>
              browse files
            </span>
          </p>

          <small>
            PDF or DOCX · Maximum 10MB
          </small>

        </button>

      ) : (

        <div className="file-upload__selected">

          <div className="file-upload__file-icon">

            {file.name
              .toLowerCase()
              .endsWith(".pdf")
              ? "PDF"
              : "DOCX"}

          </div>

          <div className="file-upload__details">

            <h3>
              {file.name}
            </h3>

            <p>
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>

          </div>

          <button
            type="button"
            className="file-upload__remove"
            onClick={
              handleRemove
            }
          >
            Remove
          </button>

        </div>

      )}

    </div>

  );
}

export default FileUpload;