package com.bgyato.our_devices.filter;

import com.bgyato.our_devices.exceptions.ErrorInfo;
import com.bgyato.our_devices.exceptions.commons.JwtTokenErrorException;
import com.bgyato.our_devices.services.impl.JwtServiceImpl;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Date;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtServiceImpl jwtServiceImpl;
    private final UserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        System.out.println("Ejecutando JwtAuthenticationFilter");
        final String token = getTokenFromRequest(request);
        System.out.println(token);
        final String username;

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            username = jwtServiceImpl.getEmailFromToken(token);
        } catch (JwtTokenErrorException e) {
            ErrorInfo errorInfo = ErrorInfo.builder()
                    .code("3001")
                    .timestamp(new Date().toString())
                    .description(e.getMessage() != null ? e.getMessage() : "Token inválido o expirado.")
                    .exception(e.getClass().getSimpleName())
                    .build();

            String errorResponse = objectMapper.writeValueAsString(errorInfo);

            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write(errorResponse);
            return;
        }


        if (username!=null && SecurityContextHolder.getContext().getAuthentication()==null) {
            System.out.println(username);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtServiceImpl.isTokenValid(token, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                throw new JwtTokenErrorException("The token has errors.");
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }

        return null;
    }
}