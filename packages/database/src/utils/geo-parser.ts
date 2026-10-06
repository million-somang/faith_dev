/**
 * geo-parser.ts
 * 대한민국 17개 광역시·도 및 하위 시·군·구 정밀 행정구역 파서
 * 및 해외 여행지 격리 분류 유틸리티
 */

// 대한민국 표준 17개 광역자치단체 공식 명칭
export const STANDARD_PROVINCES = [
    '서울특별시',
    '경기도',
    '인천광역시',
    '강원특별자치도',
    '충청북도',
    '충청남도',
    '대전광역시',
    '세종특별자치시',
    '전북특별자치도',
    '전라남도',
    '광주광역시',
    '경상북도',
    '경상남도',
    '대구광역시',
    '울산광역시',
    '부산광역시',
    '제주특별자치도',
] as const;

export type StandardProvince = typeof STANDARD_PROVINCES[number];

// 17개 광역시·도 표준명 및 별칭(약칭/단축어) 매핑
export const PROVINCE_MAP: Record<string, string> = {
    // 서울
    '서울특별시': '서울특별시',
    '서울시': '서울특별시',
    '서울': '서울특별시',
    // 경기
    '경기도': '경기도',
    '경기': '경기도',
    // 인천
    '인천광역시': '인천광역시',
    '인천시': '인천광역시',
    '인천': '인천광역시',
    // 강원
    '강원특별자치도': '강원특별자치도',
    '강원도': '강원특별자치도',
    '강원': '강원특별자치도',
    // 충북
    '충청북도': '충청북도',
    '충북도': '충청북도',
    '충북': '충청북도',
    // 충남
    '충청남도': '충청남도',
    '충남도': '충청남도',
    '충남': '충청남도',
    // 대전
    '대전광역시': '대전광역시',
    '대전시': '대전광역시',
    '대전': '대전광역시',
    // 세종
    '세종특별자치시': '세종특별자치시',
    '세종시': '세종특별자치시',
    '세종': '세종특별자치시',
    // 전북
    '전북특별자치도': '전북특별자치도',
    '전라북도': '전북특별자치도',
    '전북도': '전북특별자치도',
    '전북': '전북특별자치도',
    // 전남
    '전라남도': '전라남도',
    '전남도': '전라남도',
    '전남': '전라남도',
    // 광주
    '광주광역시': '광주광역시',
    '광주': '광주광역시',
    // 경북
    '경상북도': '경상북도',
    '경북도': '경상북도',
    '경북': '경상북도',
    // 경남
    '경상남도': '경상남도',
    '경남도': '경상남도',
    '경남': '경상남도',
    // 대구
    '대구광역시': '대구광역시',
    '대구시': '대구광역시',
    '대구': '대구광역시',
    // 울산
    '울산광역시': '울산광역시',
    '울산시': '울산광역시',
    '울산': '울산광역시',
    // 부산
    '부산광역시': '부산광역시',
    '부산시': '부산광역시',
    '부산': '부산광역시',
    // 제주
    '제주특별자치도': '제주특별자치도',
    '제주도': '제주특별자치도',
    '제주': '제주특별자치도',
};

// 주요 시·군·구 단축명 매핑 (예: "강릉" -> "강릉시", "경주" -> "경주시")
export const SHORT_CITY_MAP: Record<string, { city: string; defaultProvince: string }> = {
    // 서울 주요 구
    '강남': { city: '강남구', defaultProvince: '서울특별시' },
    '강동': { city: '강동구', defaultProvince: '서울특별시' },
    '강북': { city: '강북구', defaultProvince: '서울특별시' },
    '강서': { city: '강서구', defaultProvince: '서울특별시' },
    '관악': { city: '관악구', defaultProvince: '서울특별시' },
    '광진': { city: '광진구', defaultProvince: '서울특별시' },
    '구로': { city: '구로구', defaultProvince: '서울특별시' },
    '금천': { city: '금천구', defaultProvince: '서울특별시' },
    '노원': { city: '노원구', defaultProvince: '서울특별시' },
    '도봉': { city: '도봉구', defaultProvince: '서울특별시' },
    '동대문': { city: '동대문구', defaultProvince: '서울특별시' },
    '동작': { city: '동작구', defaultProvince: '서울특별시' },
    '마포': { city: '마포구', defaultProvince: '서울특별시' },
    '서대문': { city: '서대문구', defaultProvince: '서울특별시' },
    '서초': { city: '서초구', defaultProvince: '서울특별시' },
    '성동': { city: '성동구', defaultProvince: '서울특별시' },
    '성북': { city: '성북구', defaultProvince: '서울특별시' },
    '송파': { city: '송파구', defaultProvince: '서울특별시' },
    '양천': { city: '양천구', defaultProvince: '서울특별시' },
    '영등포': { city: '영등포구', defaultProvince: '서울특별시' },
    '용산': { city: '용산구', defaultProvince: '서울특별시' },
    '은평': { city: '은평구', defaultProvince: '서울특별시' },
    '종로': { city: '종로구', defaultProvince: '서울특별시' },
    '중랑': { city: '중랑구', defaultProvince: '서울특별시' },

    // 부산 주요 구/군
    '해운대': { city: '해운대구', defaultProvince: '부산광역시' },
    '수영': { city: '수영구', defaultProvince: '부산광역시' },
    '기장': { city: '기장군', defaultProvince: '부산광역시' },
    '영도': { city: '영도구', defaultProvince: '부산광역시' },
    '부산진': { city: '부산진구', defaultProvince: '부산광역시' },
    '동래': { city: '동래구', defaultProvince: '부산광역시' },
    '사하': { city: '사하구', defaultProvince: '부산광역시' },
    '금정': { city: '금정구', defaultProvince: '부산광역시' },

    // 대구/인천/대전/광주/울산
    '수성': { city: '수성구', defaultProvince: '대구광역시' },
    '달서': { city: '달서구', defaultProvince: '대구광역시' },
    '달성': { city: '달성군', defaultProvince: '대구광역시' },
    '군위': { city: '군위군', defaultProvince: '대구광역시' },
    '연수': { city: '연수구', defaultProvince: '인천광역시' },
    '부평': { city: '부평구', defaultProvince: '인천광역시' },
    '강화': { city: '강화군', defaultProvince: '인천광역시' },
    '유성': { city: '유성구', defaultProvince: '대전광역시' },
    '광산': { city: '광산구', defaultProvince: '광주광역시' },
    '울주': { city: '울주군', defaultProvince: '울산광역시' },

    // 경기도
    '수원': { city: '수원시', defaultProvince: '경기도' },
    '성남': { city: '성남시', defaultProvince: '경기도' },
    '의정부': { city: '의정부시', defaultProvince: '경기도' },
    '안양': { city: '안양시', defaultProvince: '경기도' },
    '부천': { city: '부천시', defaultProvince: '경기도' },
    '광명': { city: '광명시', defaultProvince: '경기도' },
    '평택': { city: '평택시', defaultProvince: '경기도' },
    '동두천': { city: '동두천시', defaultProvince: '경기도' },
    '안산': { city: '안산시', defaultProvince: '경기도' },
    '고양': { city: '고양시', defaultProvince: '경기도' },
    '과천': { city: '과천시', defaultProvince: '경기도' },
    '구리': { city: '구리시', defaultProvince: '경기도' },
    '남양주': { city: '남양주시', defaultProvince: '경기도' },
    '오산': { city: '오산시', defaultProvince: '경기도' },
    '시흥': { city: '시흥시', defaultProvince: '경기도' },
    '군포': { city: '군포시', defaultProvince: '경기도' },
    '의왕': { city: '의왕시', defaultProvince: '경기도' },
    '하남': { city: '하남시', defaultProvince: '경기도' },
    '용인': { city: '용인시', defaultProvince: '경기도' },
    '파주': { city: '파주시', defaultProvince: '경기도' },
    '이천': { city: '이천시', defaultProvince: '경기도' },
    '안성': { city: '안성시', defaultProvince: '경기도' },
    '김포': { city: '김포시', defaultProvince: '경기도' },
    '화성': { city: '화성시', defaultProvince: '경기도' },
    '양주': { city: '양주시', defaultProvince: '경기도' },
    '포천': { city: '포천시', defaultProvince: '경기도' },
    '여주': { city: '여주시', defaultProvince: '경기도' },
    '연천': { city: '연천군', defaultProvince: '경기도' },
    '가평': { city: '가평군', defaultProvince: '경기도' },
    '양평': { city: '양평군', defaultProvince: '경기도' },

    // 강원도
    '춘천': { city: '춘천시', defaultProvince: '강원특별자치도' },
    '원주': { city: '원주시', defaultProvince: '강원특별자치도' },
    '강릉': { city: '강릉시', defaultProvince: '강원특별자치도' },
    '동해': { city: '동해시', defaultProvince: '강원특별자치도' },
    '태백': { city: '태백시', defaultProvince: '강원특별자치도' },
    '속초': { city: '속초시', defaultProvince: '강원특별자치도' },
    '삼척': { city: '삼척시', defaultProvince: '강원특별자치도' },
    '홍천': { city: '홍천군', defaultProvince: '강원특별자치도' },
    '횡성': { city: '횡성군', defaultProvince: '강원특별자치도' },
    '영월': { city: '영월군', defaultProvince: '강원특별자치도' },
    '평창': { city: '평창군', defaultProvince: '강원특별자치도' },
    '정선': { city: '정선군', defaultProvince: '강원특별자치도' },
    '철원': { city: '철원군', defaultProvince: '강원특별자치도' },
    '화천': { city: '화천군', defaultProvince: '강원특별자치도' },
    '양구': { city: '양구군', defaultProvince: '강원특별자치도' },
    '인제': { city: '인제군', defaultProvince: '강원특별자치도' },
    '고성': { city: '고성군', defaultProvince: '강원특별자치도' },
    '양양': { city: '양양군', defaultProvince: '강원특별자치도' },

    // 충청도
    '청주': { city: '청주시', defaultProvince: '충청북도' },
    '충주': { city: '충주시', defaultProvince: '충청북도' },
    '제천': { city: '제천시', defaultProvince: '충청북도' },
    '단양': { city: '단양군', defaultProvince: '충청북도' },
    '천안': { city: '천안시', defaultProvince: '충청남도' },
    '공주': { city: '공주시', defaultProvince: '충청남도' },
    '보령': { city: '보령시', defaultProvince: '충청남도' },
    '아산': { city: '아산시', defaultProvince: '충청남도' },
    '서산': { city: '서산시', defaultProvince: '충청남도' },
    '논산': { city: '논산시', defaultProvince: '충청남도' },
    '당진': { city: '당진시', defaultProvince: '충청남도' },
    '부여': { city: '부여군', defaultProvince: '충청남도' },
    '태안': { city: '태안군', defaultProvince: '충청남도' },

    // 전라도
    '전주': { city: '전주시', defaultProvince: '전북특별자치도' },
    '군산': { city: '군산시', defaultProvince: '전북특별자치도' },
    '익산': { city: '익산시', defaultProvince: '전북특별자치도' },
    '정읍': { city: '정읍시', defaultProvince: '전북특별자치도' },
    '남원': { city: '남원시', defaultProvince: '전북특별자치도' },
    '무주': { city: '무주군', defaultProvince: '전북특별자치도' },
    '목포': { city: '목포시', defaultProvince: '전라남도' },
    '여수': { city: '여수시', defaultProvince: '전라남도' },
    '순천': { city: '순천시', defaultProvince: '전라남도' },
    '나주': { city: '나주시', defaultProvince: '전라남도' },
    '광양': { city: '광양시', defaultProvince: '전라남도' },
    '담양': { city: '담양군', defaultProvince: '전라남도' },
    '구례': { city: '구례군', defaultProvince: '전라남도' },
    '보성': { city: '보성군', defaultProvince: '전라남도' },
    '해남': { city: '해남군', defaultProvince: '전라남도' },
    '완도': { city: '완도군', defaultProvince: '전라남도' },
    '진도': { city: '진도군', defaultProvince: '전라남도' },
    '신안': { city: '신안군', defaultProvince: '전라남도' },

    // 경상도
    '포항': { city: '포항시', defaultProvince: '경상북도' },
    '경주': { city: '경주시', defaultProvince: '경상북도' },
    '김천': { city: '김천시', defaultProvince: '경상북도' },
    '안동': { city: '안동시', defaultProvince: '경상북도' },
    '구미': { city: '구미시', defaultProvince: '경상북도' },
    '영주': { city: '영주시', defaultProvince: '경상북도' },
    '상주': { city: '상주시', defaultProvince: '경상북도' },
    '문경': { city: '문경시', defaultProvince: '경상북도' },
    '경산': { city: '경산시', defaultProvince: '경상북도' },
    '울진': { city: '울진군', defaultProvince: '경상북도' },
    '울릉': { city: '울릉군', defaultProvince: '경상북도' },
    '창원': { city: '창원시', defaultProvince: '경상남도' },
    '진주': { city: '진주시', defaultProvince: '경상남도' },
    '통영': { city: '통영시', defaultProvince: '경상남도' },
    '사천': { city: '사천시', defaultProvince: '경상남도' },
    '김해': { city: '김해시', defaultProvince: '경상남도' },
    '밀양': { city: '밀양시', defaultProvince: '경상남도' },
    '거제': { city: '거제시', defaultProvince: '경상남도' },
    '양산': { city: '양산시', defaultProvince: '경상남도' },
    '남해': { city: '남해군', defaultProvince: '경상남도' },
    '하동': { city: '하동군', defaultProvince: '경상남도' },

    // 제주도
    '서귀포': { city: '서귀포시', defaultProvince: '제주특별자치도' }
};

export interface ParsedLocationResult {
    province: string;
    city: string;
    isDomestic: boolean;
}

/**
 * 한국 행정구역 및 해외 여행지 주소/목적지 정밀 파싱 함수
 *
 * @param address 도로명/지번 주소 (location_address)
 * @param dest 여행지/목적지 명칭 (destination)
 * @param region 기사 권역 구분 (region: 'domestic', 'europe', 'asia', 등)
 * @returns { province, city, isDomestic }
 */
export function parseKoreanLocation(
    address?: string | null,
    dest?: string | null,
    region?: string | null
): ParsedLocationResult {
    // 1. 해외 여행지 격리 로직: region이 domestic/국내 계열이 아니면 즉시 해외 분류
    if (region) {
        const normRegion = region.trim().toLowerCase();
        if (!['domestic', '국내', 'korea', 'kr'].includes(normRegion)) {
            return { province: '해외', city: '', isDomestic: false };
        }
    }

    const addrText = (address || '').trim();
    const destText = (dest || '').trim();
    const combinedText = `${addrText} ${destText}`.trim();

    if (!combinedText) {
        return { province: '기타', city: '', isDomestic: false };
    }

    // 2. 명시적인 해외 키워드나 영문 전용 해외 주소 감지
    const overseasKeywordRegex = /(switzerland|japan|usa|france|italy|vietnam|paris|tokyo|london|bangkok|interlaken|spain|germany|canada|australia|스위스|일본|미국|프랑스|이탈리아|베트남|태국|유럽|다낭|방콕|파리|도쿄|오사카|후쿠오카|하와이|괌|발리|인터라켄|싱가포르|대만|타이베이)/i;
    if (overseasKeywordRegex.test(combinedText)) {
        // 단, 국내 지명에 스위스마을 등이 포함될 수 있으므로 국내 시도가 명확히 존재하지 않는 경우에만 해외로 격리
        const hasClearDomesticProvince = Object.keys(PROVINCE_MAP).some(key => {
            const regex = new RegExp(`(^|[\\s,])(${key})([\\s,]|$)`);
            return regex.test(addrText) || regex.test(destText);
        });

        if (!hasClearDomesticProvince) {
            return { province: '해외', city: '', isDomestic: false };
        }
    }

    // 3. 17개 광역시·도 매칭
    // 주소(address)의 첫 번째 단어 또는 앞부분을 최우선으로 검사
    let matchedProvince = '';

    // (1) 주소 단어 단위 우선 탐색
    if (addrText) {
        const addrTokens = addrText.split(/\s+/);
        for (const token of addrTokens) {
            const cleanToken = token.replace(/[,()]/g, '');
            if (PROVINCE_MAP[cleanToken]) {
                matchedProvince = PROVINCE_MAP[cleanToken];
                break;
            }
        }
    }

    // (2) 목적지 단어 단위 탐색
    if (!matchedProvince && destText) {
        const destTokens = destText.split(/\s+/);
        for (const token of destTokens) {
            const cleanToken = token.replace(/[,()]/g, '');
            if (PROVINCE_MAP[cleanToken]) {
                matchedProvince = PROVINCE_MAP[cleanToken];
                break;
            }
        }
    }

    // (3) 전문 부분 일치 탐색 (긴 명칭부터 우선 매칭하여 '강원특별자치도'가 '강원'보다 먼저 검사되도록 함)
    if (!matchedProvince) {
        const sortedProvinceKeys = Object.keys(PROVINCE_MAP).sort((a, b) => b.length - a.length);
        for (const key of sortedProvinceKeys) {
            if (combinedText.includes(key)) {
                matchedProvince = PROVINCE_MAP[key];
                break;
            }
        }
    }

    // 4. 시·군·구 추출
    let matchedCity = '';

    // 세종특별자치시는 자체 단일 기초단체이므로 세종시로 지정
    if (matchedProvince === '세종특별자치시') {
        matchedCity = '세종시';
    } else {
        // (1) 정규표현식으로 `시/군/구` 추출
        // 도로명/지번 주소 우선 탐색, 없으면 목적지 텍스트 탐색
        const textForCity = addrText || destText;
        const matches = [...textForCity.matchAll(/([가-힣]{2,6}(?:시|군|구))/g)].map(m => m[1]);

        for (const candidate of matches) {
            // 특별시/광역시/특별자치도 등 도급 광역명칭 제외
            if (candidate.endsWith('특별시') || candidate.endsWith('광역시') || candidate.endsWith('특별자치도')) {
                continue;
            }
            if (candidate === '경기도' || candidate === '강원도' || candidate === '제주도') {
                continue;
            }
            // 광주광역시인 경우 '광주시'는 시가 아니므로 제외 (단, 경기도인 경우 '광주시'는 정상 시)
            if (matchedProvince === '광주광역시' && candidate === '광주시') {
                continue;
            }

            // 시/도 특성에 따른 우선 매칭
            // 특별시/광역시 -> '구' or '군' 우선
            const isMetropolitan = matchedProvince.endsWith('특별시') || matchedProvince.endsWith('광역시');
            if (isMetropolitan) {
                if (candidate.endsWith('구') || candidate.endsWith('군')) {
                    matchedCity = candidate;
                    break;
                }
            } else {
                // 도/특별자치도 -> '시' or '군' 우선
                if (candidate.endsWith('시') || candidate.endsWith('군')) {
                    matchedCity = candidate;
                    break;
                }
            }

            // 첫 번째 유효 후보 임시 보관
            if (!matchedCity) {
                matchedCity = candidate;
            }
        }

        // (2) 정규표현식으로 찾지 못한 경우 (예: "강원 강릉", "경북 경주") 단축 시군명 매핑 적용
        if (!matchedCity) {
            const allTokens = combinedText.split(/\s+/).map(t => t.replace(/[,()]/g, ''));
            for (const token of allTokens) {
                if (SHORT_CITY_MAP[token]) {
                    matchedCity = SHORT_CITY_MAP[token].city;
                    if (!matchedProvince) {
                        matchedProvince = SHORT_CITY_MAP[token].defaultProvince;
                    }
                    break;
                }
            }
        }
    }

    // 5. 도가 아직 결정되지 않았으나 시군구로부터 도를 역추적할 수 있는 경우
    if ((!matchedProvince || matchedProvince === '기타') && matchedCity) {
        for (const info of Object.values(SHORT_CITY_MAP)) {
            if (info.city === matchedCity) {
                matchedProvince = info.defaultProvince;
                break;
            }
        }
    }

    // 6. 결과 조합 및 유효성 판별
    const finalProvince = matchedProvince || '기타';
    const isDomestic = (STANDARD_PROVINCES as readonly string[]).includes(finalProvince);

    return {
        province: finalProvince,
        city: matchedCity || '',
        isDomestic
    };
}

/**
 * 단일 주소/목적지 문자열 파싱 편의 함수 (호환용 alias)
 */
export function parseKoreanAddress(addressOrDest: string): ParsedLocationResult {
    return parseKoreanLocation(addressOrDest);
}
