#version 330 core
out vec4 FragColor;

in vec3 VPos;

float phase(float cosTheta, float g){

    return 1.0;
    float subRes1=1.5*(1-g*g)/(2*(2+g*g));
    float subRes2=(1+cosTheta*cosTheta)/(1+g*g-2*g*cosTheta);
    return subRes1*subRes2;
}

vec2 rayBallIntersection(vec3 rayDir, vec3 rayPos, vec3 spherePos, float r) {
    vec3 oc = rayPos - spherePos;

    float b = dot(rayDir, oc);
    float c = dot(oc, oc) - r * r;
    float discriminant = b * b - c;

    vec2 res = vec2(-1.0); // Default: no intersection
    if (discriminant > 0.0) {
        float sqrtDisc = sqrt(discriminant);
        float t1 = -b - sqrtDisc;
        float t2 = -b + sqrtDisc;
        res = vec2(t1, t2);
    }
    return res;
}

float scattering(float lambda){
    float scatteringConstant=1;
    return scatteringConstant;
}

float sunlightIntensity(float lambda){
    float a=1;
    return a;
}

float outScattering(vec3 P1, vec3 P2, float lambda, float avgAtmosDensHeight, int numberOfIterations, vec3 spherePos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations;i++){
        float t=float(i + 0.5)/numberOfIterations;
        vec3 P=(1-t)*P1+t*P2;
        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);
        if (distToSpherePos!=distToSpherePos){
            return 1.0;
        }
        if (i==0 || i==numberOfIterations-1){
            integral+=0.5*exp(-height/avgAtmosDensHeight);
        }
        else{
            if (exp(-height/avgAtmosDensHeight)>=0){
                return 1.0;
            }
            integral+=exp(-height/avgAtmosDensHeight);
        }
    
    }
    return integral/**scattering(lambda)/numberOfIterations*/;
}

//I_v(\lambda) = I_s(\lambda) \times K(\lambda) \times F(\theta, g) \times \int_{P_a}^{P_b} \exp\left(\frac{-h}{H_0}\right) \times \exp\left(-t(P{P_c}, \lambda) - t(P{P_a}, \lambda)\right) \, ds
float inScattering(float lambda, float avgAtmosDensHeight, float g, vec3 P1, vec3 P2, int numberOfIterations1, int numberOfIterations2, vec3 spherePos, vec3 sunPos, float atmosphereR, float planetR){
    float integral=0;
    for (int i=0;i<numberOfIterations1;i++){
        float t=float(i + 0.5)/numberOfIterations1;
        vec3 P=(1-t)*P1+t*P2;

        float distToSpherePos=length(spherePos-P);
        float height= (distToSpherePos-planetR)/(atmosphereR-planetR);
        float t1=exp(-height/avgAtmosDensHeight);

        float t2 = outScattering(P, sunPos, lambda, avgAtmosDensHeight,  numberOfIterations2, spherePos, atmosphereR, planetR);
        float t3 = outScattering(P, P1, lambda, avgAtmosDensHeight, numberOfIterations2, spherePos, atmosphereR, planetR);

        integral+=t1*exp(-t2-t3);
    }

    //float cosTheta=abs(dot(sunPos-P1, P2-P1))/length(sunPos-P1)/length(P2-P1);
    return /*sunlightIntensity(lambda) * scattering(lambda) * phase(cosTheta,g) * */integral / numberOfIterations1;
}

void main()
{
    vec3 sunPos=vec3(0,0,1000);
    vec3 spherePos=vec3(0,0,300);
    float planetR=100;
    float atmosphereR=150;
    
    float g=0;
    float lambda=0.55;
    float avgAtmosDensHeight=0.25;

    int numberOfIterations1=10;
    int numberOfIterations2=10;

    vec3 rayPos=vec3(0,0,0);
    vec3 rayDir=vec3(VPos.x, VPos.y, 1);

    rayDir=rayDir/length(rayDir);

    vec2 d=rayBallIntersection(rayDir, rayPos, spherePos, planetR);

    vec3 P1=d.x*rayDir+rayPos;
    vec3 P2=d.y*rayDir+rayPos;

    float value=0;
    value=inScattering(lambda, avgAtmosDensHeight, g, P1,P2, numberOfIterations1, numberOfIterations2, spherePos, sunPos, atmosphereR, planetR);
    if (value>=0){
        FragColor=vec4(value, value, value,0);
    }
    else{
        FragColor=vec4(1,0,1,0);
    }
}