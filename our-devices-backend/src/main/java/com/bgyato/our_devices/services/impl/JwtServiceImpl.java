package com.bgyato.our_devices.services.impl;

import com.bgyato.our_devices.commons.constants.security.SecurityConstants;
import com.bgyato.our_devices.exceptions.commons.JwtTokenErrorException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtServiceImpl {

    public String getToken(UserDetails user) {
        return getToken(new HashMap<>(), user);
    }

    public String getToken(Map<String, Object> extraClaims, UserDetails user) {
        Date now = new Date();

        return Jwts
                .builder()
                .setClaims(extraClaims)
                .subject(SecurityConstants.JWT_SUBJECT)
                .issuer(SecurityConstants.JWT_ISSUES)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + SecurityConstants.JWT_EXPIRATION_TIME))
                .signWith(getKey())
                .compact();
    }

    private Key getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(SecurityConstants.JWT_KEY);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String getEmailFromToken(String token) {
        return getClaim(token, claims -> claims.get("email", String.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = getEmailFromToken(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }


    private Claims getAllClaims(String token) {
        Key key = getKey();
        try {
            return Jwts
                    .parser()
                    .verifyWith((SecretKey) key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            throw new JwtTokenErrorException("Error con el token: "+e.getMessage());
        }
    }

    public <T> T getClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Date getExpiration(String token) {
        return getClaim(token, Claims::getExpiration);
    }

    private boolean isTokenExpired(String token) {
        return getExpiration(token).before(new Date());
    }

}
