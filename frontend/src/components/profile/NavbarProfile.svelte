<script>
    import { onMount } from 'svelte';

    function isLoggedIn() {
        document.cookie.includes('logged_in=true')
    }

    let logged_in = $state(false);
    let username = $state("");

    onMount(() => {
        const isAuthed = document.cookie.includes("logged_in=true");
        logged_in = isAuthed;
        if (isAuthed) {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    const parsed = JSON.parse(storedUser);
                    username = parsed.user_name || "Profile";
                } catch (e) {
                    username = "Profile";
                }
            }
        }
    });
</script>

<div class="user">
{#if !logged_in}
    <a class="secondary" href="/login">Login</a>
    <a class="primary" href="/register">Register</a>
{:else}
    <a class="primary" href="/profile/">@{username}</a>
{/if}
</div>

<style>
    .user {
        display: flex;
        gap: 0.75rem;
        text-transform: uppercase;
    }

    .user a {
        font-size: 1rem;
        line-height: 100%;
        padding: 0.5rem 1.25rem;
        border-radius: 2rem;
        text-decoration: none;
    }

    a.primary {
        background-color: var(--neutral-900);
        color: var(--neutral-100);
    }

    a.secondary {
        background-color: var(--neutral-100);
        color: var(--neutral-900);
        outline: 1px solid var(--neutral-900);
        outline-offset: -1px;
    }
</style>