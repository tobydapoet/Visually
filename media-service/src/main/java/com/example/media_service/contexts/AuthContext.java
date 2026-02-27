package com.example.media_service.contexts;


import com.example.media_service.requests.CurrentUser;

public class AuthContext {
    private static final ThreadLocal<CurrentUser> CURRENT = new ThreadLocal<>();

    public static void set(CurrentUser user) {
        CURRENT.set(user);
    }

    public static CurrentUser get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}

