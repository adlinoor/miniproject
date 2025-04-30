import * as Yup from "yup";

export const RegisterSchema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address format")
    .required("Email cannot be empty"),
  password: Yup.string()
    .min(3, "Password must be 3 characters at minimum")
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/,
      "Password harus mengandung setidaknya satu huruf besar, satu huruf kecil, satu angka, dan satu karakter khusus"
    )
    .required("Password cannot be empty"),
  firstName: Yup.string().required("cannot be empty"),
  lastName: Yup.string().required("cannot be empty"),
});
