import { useState } from "react";
import FileUpload from "../../Components/Interview/FileUpload";
import { extractCvText } from "../../services/cvTextExtractor";
import "./InterviewSetUpPage.css";
import { useNavigate } from "react-router-dom";

type JobInputType = "jd" | "role";

function InterviewSetupPage() {

  const [jobInputType, setJobInputType] =
    useState<JobInputType>("jd");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [role, setRole] =
    useState("");

  const [jobDescription, setJobDescription] =
    useState("");

  const [isExtractingCv, setIsExtractingCv] =
    useState(false);

  const [cvError, setCvError] =
    useState("");

  const navigate = useNavigate();

  /* =========================================================
     Handle CV Selection
  ========================================================= */

  const handleFileSelect = async (
    file: File
  ) => {

    setSelectedFile(file);

    setCvError("");

    setIsExtractingCv(true);

    try {

      console.log(
        "Extracting CV text..."
      );

      const cvText =
        await extractCvText(
          file
        );

      console.log(
        "CV text extracted:",
        cvText
      );

      /*
       * Store the actual CV text.
       */

      sessionStorage.setItem(
        "grfiCvText",
        cvText
      );

      /*
       * Store filename for display/reference.
       */

      sessionStorage.setItem(
        "grfiCvFileName",
        file.name
      );

    } catch (error) {

      console.error(
        "CV extraction failed:",
        error
      );

      /*
       * Remove old CV data if extraction
       * failed.
       */

      sessionStorage.removeItem(
        "grfiCvText"
      );

      sessionStorage.removeItem(
        "grfiCvFileName"
      );

      setSelectedFile(null);

      setCvError(
        error instanceof Error
          ? error.message
          : "Unable to read your CV."
      );

    } finally {

      setIsExtractingCv(
        false
      );

    }
  };

  /* =========================================================
     Continue
  ========================================================= */

  const handleContinue = () => {

    /*
     * Don't continue while CV is being processed.
     */

    if (
      !selectedFile ||
      isExtractingCv
    ) {
      return;
    }

    /*
     * Make sure CV text exists.
     */

    const cvText =
      sessionStorage.getItem(
        "grfiCvText"
      );

    if (!cvText) {

      setCvError(
        "Your CV could not be processed. Please upload it again."
      );

      return;

    }

    /*
     * Save job input type.
     */

    sessionStorage.setItem(
      "grfiJobInputType",
      jobInputType
    );

    /*
     * Save role.
     */

    sessionStorage.setItem(
      "grfiRole",
      role
    );

    /*
     * Save JD.
     */

    sessionStorage.setItem(
      "grfiJobDescription",
      jobDescription
    );

    /*
     * Move to Step 2.
     */

    navigate(
      "/interviewConfig"
    );
  };

  return (

    <main className="setup-page">

      <div className="setup-page__container">

        {/* =================================================
            Header
        ================================================= */}

        <div className="setup-page__header">

          <span>
            STEP 1 OF 2
          </span>

          <h1>
            Set up your interview
          </h1>

          <p>
            Tell GRFI about yourself and the role you're
            preparing for.
          </p>

        </div>

        {/* =================================================
            CV
        ================================================= */}

        <section className="setup-section">

          <div className="setup-section__heading">

            <div>

              <span className="setup-section__number">
                01
              </span>

              <h2>
                Upload your CV
              </h2>

            </div>

            <span className="required">
              Required
            </span>

          </div>

          <p className="setup-section__description">

            We'll use your CV to create questions based on
            your actual experience, skills and projects.

          </p>

          <FileUpload
            onFileSelect={
              handleFileSelect
            }
          />

          {/* =================================================
              CV Processing
          ================================================= */}

          {isExtractingCv && (

            <div className="cv-processing">

              <span>
                ⏳
              </span>

              <p>
                Reading your CV...
              </p>

            </div>

          )}

          {/* =================================================
              CV Error
          ================================================= */}

          {cvError && (

            <div className="cv-error">

              {cvError}

            </div>

          )}

          {/* =================================================
              CV Ready
          ================================================= */}

          {selectedFile &&
            !isExtractingCv &&
            !cvError && (

              <div className="cv-success">

                ✓ CV ready for your
                personalised interview

              </div>

            )}

        </section>

        {/* =================================================
            Job
        ================================================= */}

        <section className="setup-section">

          <div className="setup-section__heading">

            <div>

              <span className="setup-section__number">
                02
              </span>

              <h2>
                Add your target job
              </h2>

            </div>

            <span className="optional">
              Optional
            </span>

          </div>

          <p className="setup-section__description">

            Have a job description? Paste it. Don't have one?
            Select the role you're preparing for.

          </p>

          {/* =================================================
              Tabs
          ================================================= */}

          <div className="job-tabs">

            <button
              type="button"
              className={
                jobInputType === "jd"
                  ? "job-tabs__button active"
                  : "job-tabs__button"
              }
              onClick={() =>
                setJobInputType("jd")
              }
            >
              Paste Job Description
            </button>

            <button
              type="button"
              className={
                jobInputType === "role"
                  ? "job-tabs__button active"
                  : "job-tabs__button"
              }
              onClick={() =>
                setJobInputType("role")
              }
            >
              Select a Role
            </button>

          </div>

          {/* =================================================
              JD
          ================================================= */}

          {jobInputType === "jd" && (

            <div className="job-input">

              <textarea
                value={
                  jobDescription
                }
                onChange={(
                  event
                ) =>
                  setJobDescription(
                    event.target.value
                  )
                }
                placeholder="Paste the job description here..."
                rows={10}
              />

              <span>
                Your job description stays on this device for now.
              </span>

            </div>

          )}

          {/* =================================================
              Role
          ================================================= */}

          {jobInputType === "role" && (

            <div className="role-input">

              <label htmlFor="role">
                Target role
              </label>

              <select
                id="role"
                value={role}
                onChange={(
                  event
                ) =>
                  setRole(
                    event.target.value
                  )
                }
              >

                <option value="">
                  Select a role
                </option>

                <option value="frontend-developer">
                  Frontend Developer
                </option>

                <option value="react-developer">
                  React Developer
                </option>

                <option value="backend-developer">
                  Backend Developer
                </option>

                <option value="full-stack-developer">
                  Full Stack Developer
                </option>

                <option value="software-engineer">
                  Software Engineer
                </option>

                <option value="ui-developer">
                  UI Developer
                </option>

                <option value="web-developer">
                  Web Developer
                </option>

                <option value="software-tester">
                  Software Tester
                </option>

                <option value="devops-engineer">
                  DevOps Engineer
                </option>

                <option value="project-manager">
                  Project Manager
                </option>

              </select>

            </div>

          )}

        </section>

        {/* =================================================
            Footer
        ================================================= */}

        <div className="setup-page__footer">

          <button
            type="button"
            className="setup-page__continue"
            disabled={
              !selectedFile ||
              isExtractingCv
            }
            onClick={
              handleContinue
            }
          >

            {isExtractingCv
              ? "Reading CV..."
              : "Continue"}

            {!isExtractingCv && (
              <span>
                →
              </span>
            )}

          </button>

          <p>
            Your CV is required to create a personalised interview.
          </p>

        </div>

      </div>

    </main>

  );
}

export default InterviewSetupPage;