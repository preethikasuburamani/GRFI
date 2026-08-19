import { useState } from "react";
import FileUpload from "../../Components/Interview/FileUpload";
import "./InterviewSetUpPage.css";

type JobInputType = "jd" | "role";

function InterviewSetupPage() {
  const [jobInputType, setJobInputType] =
    useState<JobInputType>("jd");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [role, setRole] = useState("");

  return (
    <main className="setup-page">

      <div className="setup-page__container">

        {/* Header */}

        <div className="setup-page__header">

          <span>STEP 1 OF 2</span>

          <h1>
            Set up your interview
          </h1>

          <p>
            Tell GRFI about yourself and the role you're
            preparing for.
          </p>

        </div>

        {/* CV */}

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
            onFileSelect={(file) =>
              setSelectedFile(file)
            }
          />

        </section>

        {/* Job */}

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

          {/* Tabs */}

          <div className="job-tabs">

            <button
              type="button"
              className={
                jobInputType === "jd"
                  ? "job-tabs__button active"
                  : "job-tabs__button"
              }
              onClick={() => setJobInputType("jd")}
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
              onClick={() => setJobInputType("role")}
            >
              Select a Role
            </button>

          </div>

          {/* JD */}

          {jobInputType === "jd" && (
            <div className="job-input">

              <textarea
                placeholder="Paste the job description here..."
                rows={10}
              />

              <span>
                Your job description stays on this device for now.
              </span>

            </div>
          )}

          {/* Role */}

          {jobInputType === "role" && (
            <div className="role-input">

              <label htmlFor="role">
                Target role
              </label>

              <select
                id="role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value)
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

                <option value="javascript-developer">
                  JavaScript Developer
                </option>

                <option value="typescript-developer">
                  TypeScript Developer
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

              </select>

            </div>
          )}

        </section>

        {/* Continue */}

        <div className="setup-page__footer">

          <button
            type="button"
            className="setup-page__continue"
            disabled={!selectedFile}
          >
            Continue
            <span>→</span>
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