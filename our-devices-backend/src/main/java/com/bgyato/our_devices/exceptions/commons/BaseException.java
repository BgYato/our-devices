package com.bgyato.our_devices.exceptions.commons;

public class BaseException extends RuntimeException{
    public BaseException(String message) {
        super(message);
    }

    public BaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
