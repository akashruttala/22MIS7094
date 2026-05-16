package com.campus.notification.middleware;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;

@Component
public class LoggingMiddleware implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(LoggingMiddleware.class);

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        Instant start = Instant.now();
        logger.info("INCOMING REQUEST: {} {} from {}", httpRequest.getMethod(), httpRequest.getRequestURI(), httpRequest.getRemoteAddr());

        chain.doFilter(request, response);

        Instant finish = Instant.now();
        long timeElapsed = Duration.between(start, finish).toMillis();

        logger.info("OUTGOING RESPONSE: {} {} with status {} in {} ms",
                httpRequest.getMethod(), httpRequest.getRequestURI(), httpResponse.getStatus(), timeElapsed);
    }
}
