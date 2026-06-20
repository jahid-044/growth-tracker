import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormValues, type SignupFieldValues } from "@/lib/signupSchema";
import { signup, type SignupPayload } from "@/lib/api";
import { FormField, fieldClassName } from "@/components/ui/field";
import { EmailField } from "@/components/signup/EmailField";
import { PasswordField } from "@/components/signup/PasswordField";
import { DepartmentField } from "@/components/signup/DepartmentField";
import { BirthdatePicker } from "@/components/signup/BirthdatePicker";
import { AddressList } from "@/components/signup/AddressList";
import { ChipRadioGroup } from "@/components/signup/ChipRadioGroup";

function Signup() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SignupFieldValues, unknown, SignupFormValues>({
    resolver: zodResolver(signupSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
      role: "LEARNER",
      teamName: "",
      department: "",
      experienceLevel: "JUNIOR",
      bio: "",
      birthdateYear: "",
      birthdateMonth: "",
      birthdateDay: "",
      addresses: [],
    },
  });

  const {
    control,
    handleSubmit,
    setValue,
    resetField,
    register,
    formState: { errors, isSubmitting },
  } = form;

  const role = useWatch({ control, name: "role" });
  const experienceLevel = useWatch({ control, name: "experienceLevel" });
  const bio = useWatch({ control, name: "bio" }) ?? "";

  function handleRoleChange(newRole: "LEARNER" | "MANAGER") {
    setValue("role", newRole);
    if (newRole === "LEARNER") resetField("teamName", { defaultValue: "" });
  }

  async function onSubmit(data: SignupFormValues) {
    setServerError(null);

    const payload: SignupPayload = {
      email: data.email,
      password: data.password,
      role: data.role,
      department: data.department,
      experienceLevel: data.experienceLevel,
      birthdate: `${data.birthdateYear}-${data.birthdateMonth}-${data.birthdateDay}`,
      addresses:
        data.addresses?.map(({ label, street1, street2, city, zipCode }) => ({
          label,
          street1,
          ...(street2 ? { street2 } : {}),
          city,
          zipCode: Number(zipCode),
        })) ?? [],
    };

    if (data.role === "MANAGER") payload.teamName = data.teamName;
    if (data.bio) payload.bio = data.bio;

    try {
      const { ok, data: responseData } = await signup(payload);

      if (!ok) {
        setServerError(responseData.message ?? "Something went wrong. Please try again.");
        return;
      }

      if (responseData.accessToken) {
        localStorage.setItem("accessToken", responseData.accessToken);
      }
      navigate("/");
    } catch {
      setServerError("Unable to reach the server. Please check your connection and try again.");
    }
  }

  return (
    <FormProvider {...form}>
      <form
        data-testid="signup-form"
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-neutral-900">Create account</h1>

        <EmailField />
        <PasswordField />

        <ChipRadioGroup
          label="Role"
          name="role"
          value={role}
          onChange={handleRoleChange}
          options={[
            { value: "LEARNER", label: "Learner", testid: "role-learner" },
            { value: "MANAGER", label: "Manager", testid: "role-manager" },
          ]}
        />

        {role === "MANAGER" && (
          <FormField label="Team name" htmlFor="teamName" error={errors.teamName?.message}>
            <input
              id="teamName"
              data-testid="team-name-input"
              className={fieldClassName}
              {...register("teamName")}
            />
          </FormField>
        )}

        <DepartmentField />

        <ChipRadioGroup
          label="Experience level"
          name="experienceLevel"
          value={experienceLevel}
          onChange={(value) => setValue("experienceLevel", value)}
          options={[
            { value: "JUNIOR", label: "JUNIOR", testid: "experience-junior" },
            { value: "MID", label: "MID", testid: "experience-mid" },
            { value: "SENIOR", label: "SENIOR", testid: "experience-senior" },
          ]}
        />

        <FormField label="Bio" htmlFor="bio" optional error={errors.bio?.message}>
          <textarea
            id="bio"
            data-testid="bio-input"
            maxLength={250}
            rows={3}
            className={fieldClassName}
            {...register("bio")}
          />
          <p className="text-right text-xs text-neutral-400">
            <span data-testid="bio-char-count">{bio.length} / 250</span>
          </p>
        </FormField>

        <BirthdatePicker />

        <AddressList />

        {serverError && (
          <p data-testid="error-message" className="text-sm text-red-600">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          data-testid="submit-btn"
          disabled={isSubmitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </FormProvider>
  );
}

export default Signup;
