<script>
    let step = $state(1);
    let username = $state("");
    let display_name = $state("");
    let email = $state("");
    let password = $state("");
    let rememberMe = $state(false);
    let errorMessage = $state("");
    let isLoading = $state(false);

    async function handleRegister(e) {
        e.preventDefault();
        errorMessage = "";
        isLoading = true;

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, display_name, email, password })
            });

            const data = await res.json();
            if (!res.ok) {
                errorMessage = data.error || "Registration failed";
                return;
            }

            step = 2;
        } catch (err) {
            console.log(err)
            errorMessage = "Network error. Please try again.";
        } finally {
            isLoading = false;
        }
    }

    async function handleLoginSession(e) {
        e.preventDefault();
        errorMessage = "";
        isLoading = true;

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, rememberMe })
            });

            const data = await res.json();
            if (!res.ok) {
                errorMessage = data.error || "Login setup failed";
                return;
            }

            window.location.href = "/profile/";
        } catch (err) {
            errorMessage = "Network error. Please try again.";
        } finally {
            isLoading = false;
        }
    }
</script>

{#if errorMessage}
    <div style="color: red; margin-bottom: 1rem;">{errorMessage}</div>
{/if}
{#if step === 1}
    <!-- STEP 1: Registration Form -->
    <form onsubmit={handleRegister}>
        <label for="username">Username:</label><br>
        <input type="text" name="username" id="username" bind:value={username} required /><br><br>

        <label for="display_name">Display name:</label><br>
        <input type="text" name="display_name" id="display_name" bind:value={display_name} required /><br><br>

        <label for="email">Email:</label><br>
        <input type="email" name="email" id="email" bind:value={email} /><br><br>

        <label for="password">Password:</label><br>
        <input type="password" name="password" id="password" bind:value={password} required /><br><br>

        <button type="submit" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Continue"}
        </button>
    </form>

{:else}
    <form onsubmit={handleLoginSession}>
        <p>Account created successfully! Choose how you'd like to stay connected.</p>

        <!-- Hidden inputs just to keep the values present if needed, though bound variables handle it -->
        <input type="hidden" bind:value={username} />
        <input type="hidden" bind:value={password} />

        <div style="margin: 1.5rem 0;">
            <label style="display: flex; align-items: center; gap: 0.5r em; cursor: pointer;">
                <input type="checkbox" bind:checked={rememberMe} />
                <span>Keep me logged in (Stay logged in for 7 days)</span>
            </label>
        </div>

        <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Get Started"}
        </button>
    </form>
{/if}