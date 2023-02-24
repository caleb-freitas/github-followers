require("dotenv").config()

const listUsers = async (userType) => {
    const users = []
    let currentPage = 1

    while (true) {
        const response = await fetch(
            `${process.env.GITHUB_API_BASE_URL}/${userType}?page=${currentPage}&per_page=100`,
            {
                headers: {
                    Authorization: `token ${process.env.GITHUB_TOKEN}`,
                    Accept: "application/vnd.github.v3+json",
                },
            }
        )

        if (response.ok) {
            const currentPageUsers = await response.json()

            if (currentPageUsers.length === 0) break

            users.push(...currentPageUsers.map((user) => user.login))
            currentPage++
        }

        if (!response.ok) {
            throw new Error(
                `Failed to list ${userType}: ${response.status} ${response.statusText}`
            )
        }
    }

    return users
}

const unfollowUser = async (username) => {
    const response = await fetch(
        `https://api.github.com/user/following/${username}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    )

    if (!response.ok) {
        const data = await response.json()
        throw new Error(`Failed to unfollow user ${username}: ${data.message}`)
    }
}

const followUser = async (username) => {
    const response = await fetch(
        `https://api.github.com/user/following/${username}`,
        {
            method: "PUT",
            headers: {
                Authorization: `token ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        }
    )

    if (!response.ok) {
        const data = await response.json()
        throw new Error(`Failed to unfollow user: ${data.message}`)
    }
}

const calculateArrayDifference = (arrayA, arrayB) => {
    const difference = arrayA.filter((x) => !arrayB.includes(x))
    return difference
}

;(async () => {
    try {
        const followers = await listUsers("followers")
        const following = await listUsers("following")

        const followingWithoutFollowers = calculateArrayDifference(
            following,
            followers
        )

        const followersWithoutFollowing = calculateArrayDifference(
            followers,
            following
        )

        const unfollowPromises = followingWithoutFollowers.map(unfollowUser)
        const followPromises = followersWithoutFollowing.map(followUser)

        await Promise.all([...unfollowPromises, ...followPromises])
    } catch (error) {
        throw error
    }
})()
