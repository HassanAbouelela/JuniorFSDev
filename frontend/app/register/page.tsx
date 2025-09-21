"use client";
import {useForm} from "react-hook-form";
import {z} from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {useAuth} from "@/lib/store";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import Link from "next/link";
import {toErrorMessage} from "@/lib/utils";

const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
    const {
        register: reg,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormValues>({resolver: zodResolver(schema)});
    const auth = useAuth();
    const router = useRouter();

    const onSubmit = async (values: FormValues) => {
        try {
            await auth.register(values.name, values.email, values.password);
            toast.success("Account created");
            router.replace("/tasks");
        } catch (e: any) {
            toast.error(toErrorMessage(e, "Registration failed"));
        }
    };

    return (
        <div className="mx-auto max-w-sm">
            <h1 className="text-2xl font-semibold mb-4">Register</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm mb-1">Name</label>
                    <input className="input" type="text" {...reg("name")} />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input className="input" type="email" {...reg("email")} />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input className="input" type="password" {...reg("password")} />
                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
                <button className="btn w-full" disabled={isSubmitting}
                        type="submit">{isSubmitting ? "Creating..." : "Create account"}</button>
            </form>
            <p className="text-sm text-muted-foreground mt-4">Already have an account? <Link className="underline"
                                                                                             href="/login">Login</Link>
            </p>
        </div>
    );
}
