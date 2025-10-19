package com.bgyato.our_devices.exceptions.advice;

import com.bgyato.our_devices.exceptions.ErrorInfo;
import com.bgyato.our_devices.exceptions.commons.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Date;

@RestControllerAdvice
public class ExceptionGenericHandlerAdvice {

    @ExceptionHandler(JwtTokenErrorException.class)
    public ResponseEntity<ErrorInfo> jwtTokenErrorException (JwtTokenErrorException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                ErrorInfo.builder()
                        .code("3001")
                        .timestamp(new Date().toString())
                        .description(e.getMessage())
                        .exception(e.getClass().getSimpleName())
                        .build()
        );
    }

    @ExceptionHandler(EntityAlreadyExistsException.class)
    public ResponseEntity<ErrorInfo> handleEntityAlreadyExistsException(EntityAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorInfo.builder()
                .code("1002")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorInfo> handleEntityNotFoundException(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ErrorInfo.builder()
                .code("1003")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorInfo> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorInfo.builder()
                .code("1005")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }

    @ExceptionHandler(UserIsNotValidatedException.class)
    public ResponseEntity<ErrorInfo> handleUserIsNotValidatedException(UserIsNotValidatedException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(ErrorInfo.builder()
                .code("1010")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }

    @ExceptionHandler(TooEarlyException.class)
    public ResponseEntity<ErrorInfo> TooEarlyException(TooEarlyException ex) {
        return ResponseEntity.status(HttpStatus.TOO_EARLY).body(ErrorInfo.builder()
                .code("1012")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }

    @ExceptionHandler(InvalidFieldFormatException.class)
    public ResponseEntity<ErrorInfo> InvalidFieldFormatException(InvalidFieldFormatException ex) {
        return ResponseEntity.status(HttpStatus.TOO_EARLY).body(ErrorInfo.builder()
                .code("1013")
                .timestamp(String.valueOf(LocalDateTime.now()))
                .description(ex.getMessage())
                .exception(ex.getClass().getSimpleName())
                .build());
    }
}
