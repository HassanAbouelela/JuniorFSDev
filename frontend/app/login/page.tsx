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
    email: z.string().email(),
    password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
    const {
        register,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<FormValues>({resolver: zodResolver(schema)});
    const auth = useAuth();
    const router = useRouter();

    const onSubmit = async (values: FormValues) => {
        try {
            await auth.login(values.email, values.password);
            toast.success("Welcome back!");
            router.replace("/tasks");
        } catch (e: any) {
            toast.error(toErrorMessage(e, "Login failed"));
        }
    };

    return (
        <div className="mx-auto max-w-sm">
            <h1 className="text-2xl font-semibold mb-4">Login</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm mb-1">Email</label>
                    <input className="input" type="email" {...register("email")} />
                    {errors.email && <p className="form-error">{errors.email.message}</p>}
                </div>
                <div>
                    <label className="block text-sm mb-1">Password</label>
                    <input className="input" type="password" {...register("password")} />
                    {errors.password && <p className="form-error">{errors.password.message}</p>}
                </div>
                <button className="btn w-full" disabled={isSubmitting}
                        type="submit">{isSubmitting ? "Signing in..." : "Sign in"}</button>
            </form>
            <p className="text-sm text-muted-foreground mt-4">No account? <Link className="underline"
                                                                                href="/register">Register</Link></p>
        </div>
    );
}
