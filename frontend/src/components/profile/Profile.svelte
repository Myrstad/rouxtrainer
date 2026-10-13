<script>
    let logged_in = $state(document.cookie.includes("logged_in"))
    let user = $state({})

    if (logged_in) {
        // fetch user info from
        fetch("/api/user", {
            headers: {
                "Content-Type": "application/json",
            }
        }) .then( res => {
            if (res.status === 401) {
                window.location.href = "/login"
            }
            return res.json()
        }).then( response => {
                console.log(response)
                localStorage.setItem("user", JSON.stringify(response.user));
                user = response.user
        }).catch( err => console.log(err))
    }

    if (!logged_in && window.location) {
        localStorage.removeItem("user")
        window.location.href = "/login"
    }

    function logout() {
        fetch("/api/auth/logout", {
            headers: {
                "Content-Type": "application/json",
            }
        })
            .then(res => res.json())
            .then( response => {
                console.log(response)
                localStorage.removeItem("user")
                window.location.reload()
            })
    }

    function deleteUser() {
        let password = prompt("Your password is required for account deletion:")

        fetch("/api/auth/delete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({password})
        }).then( res => {
            if (!res.ok) {
                alert("Account deletion failed")
            }
            return res.json()
        }).then( response => {
            localStorage.removeItem("user")
            window.location.href = "/"
        }).catch( err => console.error(err))
    }
</script>

{#if logged_in}
    <p>Logged in!</p>
{:else}
    <p>Logged out!</p>
{/if}
{#each Object.entries(user) as [key, value]}
    <li>
        <strong>{key}:</strong> {value}
    </li>
{/each}
<button onclick={logout}>logout</button>
<button style="background-color: darkred; color: white;" onclick={deleteUser}> Delete user</button>